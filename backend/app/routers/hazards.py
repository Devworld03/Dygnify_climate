# backend/app/routers/hazards.py
import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import ValidationError

from app.db.mongo import db
from app.limiter import limiter
from app.schemas import AnalyzeRequest
from app.services.insights import build_insight
from app.services.pipeline import covers, ensure_region, get_meta, region_key, snap
from app.services.trends import compute_trend, rolling_mean

router = APIRouter(prefix="/api", tags=["hazards"])


@router.post("/analyze")
@limiter.limit("10/minute")
async def analyze(request: Request, body: AnalyzeRequest):
    try:
        meta = await ensure_region(body.lat, body.lon, body.start_year, body.end_year)
    except httpx.HTTPError:
        raise HTTPException(502, "Weather data provider unavailable, try again later")
    except ValueError as e:
        raise HTTPException(422, str(e))
    return {
        "status": "ready",
        "region_key": meta["region_key"],
        "cached": meta["cached"],
        "data_quality": meta["data_quality"],
    }


@router.get("/hazards/heatwave")
@limiter.limit("60/minute")
async def get_heatwave(request: Request, lat: float, lon: float,
                       start_year: int, end_year: int):
    try:
        p = AnalyzeRequest(lat=lat, lon=lon, start_year=start_year, end_year=end_year)
    except ValidationError as e:
        raise HTTPException(422, e.errors(include_url=False, include_context=False))

    glat, glon = snap(p.lat, p.lon)
    key = region_key(glat, glon)
    meta = await get_meta(key)
    if not covers(meta, p.start_year, p.end_year):
        raise HTTPException(404, "No data for this region/range. Call POST /api/analyze first.")

    yearly = await db.yearly_stats.find(
        {"region_key": key, "year": {"$gte": p.start_year, "$lte": p.end_year}},
        {"_id": 0, "region_key": 0},
    ).sort("year", 1).to_list(None)

    events = await db.events.find(
        {"region_key": key,
         "start": {"$gte": f"{p.start_year}-01-01", "$lte": f"{p.end_year}-12-31"}},
        {"_id": 0, "region_key": 0},
    ).sort("start", 1).to_list(None)

    days = [y["heatwave_days"] for y in yearly]
    for y, r in zip(yearly, rolling_mean(days, 5)):
        y["heatwave_days_rolling5"] = r

    trend = compute_trend([y["year"] for y in yearly], days)

    return {
        "region": {"requested": {"lat": p.lat, "lon": p.lon},
                   "grid_point": {"lat": glat, "lon": glon}},
        "range": {"start_year": p.start_year, "end_year": p.end_year},
        "baseline": meta["baseline"],
        "data_quality": meta["data_quality"],
        "yearly": yearly,
        "events": events,
        "trend": trend,
        "insight": build_insight(yearly, trend),
    }