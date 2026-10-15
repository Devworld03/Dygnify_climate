# backend/app/services/trends.py
import numpy as np
import pandas as pd
import pymannkendall as mk
from scipy import stats

MIN_YEARS = 8


def compute_trend(years: list[int], values: list[float]) -> dict:
    y = np.asarray(years, dtype=float)
    v = np.asarray(values, dtype=float)
    n = len(y)

    if n < MIN_YEARS:
        return {"method": "insufficient_data", "n_years": n, "significant": False}

    if np.ptp(v) == 0:
        return {
            "method": "mann_kendall", "trend": "no trend", "p_value": 1.0,
            "significant": False, "sen_slope": 0.0, "linear_slope": 0.0,
            "linear_p_value": 1.0, "r2": 0.0, "n_years": n,
        }

    lin = stats.linregress(y, v)
    mkr = mk.original_test(v)
    return {
        "method": "mann_kendall",
        "trend": mkr.trend,
        "p_value": round(float(mkr.p), 4),
        "significant": bool(mkr.h),
        "sen_slope": round(float(mkr.slope), 4),
        "linear_slope": round(float(lin.slope), 4),
        "linear_p_value": round(float(lin.pvalue), 4),
        "r2": round(float(lin.rvalue ** 2), 4),
        "n_years": n,
    }


def rolling_mean(values: list[float], window: int = 5) -> list[float | None]:
    s = pd.Series(values, dtype=float).rolling(window, center=True, min_periods=3).mean()
    return [None if np.isnan(x) else round(float(x), 2) for x in s]