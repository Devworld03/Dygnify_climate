# backend/app/services/cleaning.py
import numpy as np
import pandas as pd


def clean_daily(df: pd.DataFrame, max_gap: int = 2,
                min_c: float = -90.0, max_c: float = 60.0,
                max_missing_pct_year: float = 10.0) -> tuple[pd.DataFrame, dict]:
    s = df.set_index("date")["tmax"].astype(float)

    # 1. full daily index so missing dates become NaN
    s = s.reindex(pd.date_range(s.index.min(), s.index.max(), freq="D"))
    s.index.name = "date"
    total_days = len(s)
    missing_raw = int(s.isna().sum())

    # 2. physically impossible values -> NaN
    bad = (s < min_c) | (s > max_c)
    outliers = int(bad.sum())
    s[bad] = np.nan

    # 3. interpolate only gaps of <= max_gap days
    is_na = s.isna()
    run_id = (~is_na).cumsum()
    run_len = is_na.groupby(run_id).transform("sum")
    fill_mask = is_na & (run_len <= max_gap)
    interp = s.interpolate(method="time", limit_area="inside")
    s[fill_mask] = interp[fill_mask]
    interpolated = int(fill_mask.sum())

    # 4. drop years with too much missing data
    miss_pct = s.isna().groupby(s.index.year).mean() * 100
    excluded = [int(y) for y in miss_pct[miss_pct > max_missing_pct_year].index]
    s = s[~s.index.year.isin(excluded)]

    report = {
        "total_days": total_days,
        "missing_raw": missing_raw,
        "outliers_removed": outliers,
        "interpolated_days": interpolated,
        "remaining_missing": int(s.isna().sum()),
        "missing_pct": round(float(s.isna().mean() * 100), 2) if len(s) else 100.0,
        "excluded_years": excluded,
        "unit": "celsius",
    }
    return s.reset_index(), report