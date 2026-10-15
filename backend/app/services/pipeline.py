# backend/app/services/pipeline.py
import asyncio
from datetime import datetime, timezone

import pandas as pd

from app.config import settings
from app.db.mongo import db
from app.services.cleaning import clean_daily
from app.services.heatwave import compute_thresholds, detect_events
from app.services.heatwave import yearly_stats as compute_yearly
from app.services.openmeteo import fetch_daily_tmax

GRID = 0.25
_locks: dict[str, asyncio.Lock] = {}


def snap(lat: float, lon: float) -> tuple[float, float]:
    return round(round(lat / GRID) * GRID, 2), round(round(lon / GRID) * GRID, 2)


def region_key(lat: float, lon: float) -> str:
    return f"{lat:.2f},{lon:.2f}"


def covers(meta: dict | None, start_year: int, end_year: int) -> bool:
    return bool(meta) and meta["start_year"] <= start_year and meta["end_year"] >= end_year


async def get_meta(key: str) -> dict | None:
    return await db.cache_meta.find_one({"region_key": key}, {"_id": 0})


async def _insert_batched(coll, docs: list[dict], size: int = 5000) -> None:
    for i in range(0, len(docs), size):
        await coll.insert_many(docs[i:i + size], ordered=False)


async def ensure_region(lat: float, lon: float, start_year: int, end_year: int) -> dict:
    lat, lon = snap(lat, lon)
    key = region_key(lat, lon)
    lock = _locks.setdefault(key, asyncio.Lock())

    async with lock:
        meta = await get_meta(key)
        if covers(meta, start_year, end_year):
            meta["cached"] = True
            return meta

        s = min(start_year, settings.baseline_start, meta["start_year"] if meta else start_year)
        e = max(end_year, settings.baseline_end, meta["end_year"] if meta else end_year)

        df = await fetch_daily_tmax(lat, lon, s, e)
        clean, report = clean_daily(df)

        thr = compute_thresholds(
            clean, settings.baseline_start, settings.baseline_end,
            settings.percentile, settings.window_days,
        )
        ev = detect_events(clean, thr, settings.min_duration_days)
        ys = compute_yearly(ev, s, e, report["excluded_years"])

        raw_docs = [
            {"region_key": key, "date": d.strftime("%Y-%m-%d"), "tmax": float(t)}
            for d, t in zip(clean["date"], clean["tmax"]) if not pd.isna(t)
        ]
        event_docs = [
            {
                "region_key": key,
                "start": r.start.strftime("%Y-%m-%d"),
                "end": r.end.strftime("%Y-%m-%d"),
                "duration": int(r.duration),
                "peak_temp": round(float(r.peak_temp), 1),
                "intensity": float(r.intensity),
            }
            for r in ev.itertuples()
        ]
        year_docs = [
            {
                "region_key": key,
                "year": int(r.year),
                "events": int(r.events),
                "heatwave_days": int(r.heatwave_days),
                "max_duration": int(r.max_duration),
                "mean_intensity": float(r.mean_intensity),
            }
            for r in ys.itertuples()
        ]

        for coll in (db.raw_daily, db.events, db.yearly_stats):
            await coll.delete_many({"region_key": key})
        await _insert_batched(db.raw_daily, raw_docs)
        if event_docs:
            await _insert_batched(db.events, event_docs)
        if year_docs:
            await _insert_batched(db.yearly_stats, year_docs)

        meta = {
            "region_key": key,
            "lat": lat,
            "lon": lon,
            "start_year": s,
            "end_year": e,
            "baseline": {
                "period": f"{settings.baseline_start}-{settings.baseline_end}",
                "percentile": settings.percentile,
                "window_days": settings.window_days,
                "min_duration_days": settings.min_duration_days,
            },
            "data_quality": report,
        }
        await db.cache_meta.replace_one(
            {"region_key": key},
            {**meta, "fetched_at": datetime.now(timezone.utc)},
            upsert=True,
        )
        meta["cached"] = False
        return meta