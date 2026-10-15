import httpx
from fastapi import APIRouter, HTTPException, Query, Request
from app.limiter import limiter

router = APIRouter(prefix="/api", tags=["geocode"])
GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"


@router.get("/geocode")
@limiter.limit("30/minute")
async def geocode(request: Request, q: str = Query(..., min_length=2, max_length=80)):
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(
                GEOCODE_URL,
                params={"name": q, "count": 8, "language": "en", "format": "json"},
            )
            r.raise_for_status()
        except httpx.HTTPError:
            raise HTTPException(502, "Geocoding service unavailable")
    return [
        {
            "name": x["name"],
            "state": x.get("admin1"),
            "country": x.get("country"),
            "lat": x["latitude"],
            "lon": x["longitude"],
        }
        for x in r.json().get("results", [])
    ]
