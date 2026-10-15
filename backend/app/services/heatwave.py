# backend/app/services/heatwave.py
import numpy as np
import pandas as pd


def _doy365(dates: pd.Series) -> pd.Series:
    """Day-of-year on a fixed 365-day calendar (Feb 29 -> same as Feb 28)."""
    d = pd.DatetimeIndex(dates)
    doy = d.dayofyear.to_numpy().copy()
    leap_after_feb = d.is_leap_year & (d.month > 2)
    doy[leap_after_feb] -= 1
    doy[(d.month == 2) & (d.day == 29)] = 59
    return pd.Series(doy, index=getattr(dates, "index", None))


def compute_thresholds(df: pd.DataFrame, baseline_start: int, baseline_end: int,
                       percentile: float, window_days: int) -> pd.Series:
    """Percentile threshold for each day-of-year (1..365) using a circular
    window of window_days (centre +/- window_days//2) over the baseline years."""
    base = df[(df["date"].dt.year >= baseline_start) & (df["date"].dt.year <= baseline_end)]
    base = base.dropna(subset=["tmax"])
    if base.empty:
        raise ValueError("No data in baseline period")

    base_doy = _doy365(base["date"]).to_numpy()
    vals = base["tmax"].to_numpy()
    half = window_days // 2

    out = {}
    for d in range(1, 366):
        dist = np.abs(base_doy - d)
        dist = np.minimum(dist, 365 - dist)  # circular distance
        out[d] = np.percentile(vals[dist <= half], percentile)
    return pd.Series(out, name="threshold")


def detect_events(df: pd.DataFrame, thresholds: pd.Series, min_duration: int) -> pd.DataFrame:
    """Events = runs of >= min_duration consecutive days with tmax > threshold."""
    d = df.sort_values("date").reset_index(drop=True).copy()
    d["doy"] = _doy365(d["date"]).to_numpy()
    d["thr"] = d["doy"].map(thresholds)
    d["hot"] = d["tmax"] > d["thr"]          # NaN -> False
    d["excess"] = d["tmax"] - d["thr"]

    date_gap = d["date"].diff().dt.days.ne(1)  # excluded years break runs
    d["run"] = (d["hot"].ne(d["hot"].shift()) | date_gap).cumsum()

    hot = d[d["hot"]]
    if hot.empty:
        return pd.DataFrame(columns=["start", "end", "duration", "peak_temp", "intensity"])

    ev = hot.groupby("run").agg(
        start=("date", "min"),
        end=("date", "max"),
        duration=("date", "size"),
        peak_temp=("tmax", "max"),
        intensity=("excess", "mean"),
    )
    ev = ev[ev["duration"] >= min_duration].reset_index(drop=True)
    ev["intensity"] = ev["intensity"].round(2)
    return ev


def yearly_stats(events: pd.DataFrame, start_year: int, end_year: int,
                 excluded_years: list[int] | None = None) -> pd.DataFrame:
    """One row per year (zeros included) keyed by event start year."""
    excluded = set(excluded_years or [])
    years = [y for y in range(start_year, end_year + 1) if y not in excluded]
    base = pd.DataFrame({"year": years}).set_index("year")
    if events.empty:
        agg = pd.DataFrame(columns=["events", "heatwave_days", "max_duration", "mean_intensity"])
    else:
        e = events.assign(year=events["start"].dt.year)
        agg = e.groupby("year").agg(
            events=("duration", "size"),
            heatwave_days=("duration", "sum"),
            max_duration=("duration", "max"),
            mean_intensity=("intensity", "mean"),
        )
    out = base.join(agg).fillna(0)
    out["mean_intensity"] = out["mean_intensity"].round(2)
    return out.reset_index().astype(
        {"events": int, "heatwave_days": int, "max_duration": int}
    )