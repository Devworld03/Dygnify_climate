# backend/app/services/openmeteo.py
import asyncio
import httpx
import pandas as pd

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
CHUNK_YEARS = 10
MAX_RETRIES = 3


async def _fetch_chunk(client: httpx.AsyncClient, lat: float, lon: float,
                       start: str, end: str) -> pd.DataFrame:
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start,
        "end_date": end,
        "daily": "temperature_2m_max",
        "timezone": "auto",
    }
    for attempt in range(MAX_RETRIES):
        try:
            r = await client.get(ARCHIVE_URL, params=params)
            if r.status_code == 429 or r.status_code >= 500:
                raise httpx.HTTPStatusError("retryable", request=r.request, response=r)
            r.raise_for_status()
            daily = r.json()["daily"]
            return pd.DataFrame({
                "date": pd.to_datetime(daily["time"]),
                "tmax": daily["temperature_2m_max"],
            })
        except (httpx.TransportError, httpx.HTTPStatusError):
            if attempt == MAX_RETRIES - 1:
                raise
            await asyncio.sleep(2 ** attempt)


async def fetch_daily_tmax(lat: float, lon: float,
                           start_year: int, end_year: int) -> pd.DataFrame:
    chunks = []
    y = start_year
    while y <= end_year:
        y_end = min(y + CHUNK_YEARS - 1, end_year)
        chunks.append((f"{y}-01-01", f"{y_end}-12-31"))
        y = y_end + 1

    async with httpx.AsyncClient(timeout=30) as client:
        frames = []
        for start, end in chunks:
            frames.append(await _fetch_chunk(client, lat, lon, start, end))
            await asyncio.sleep(0.3)

    df = pd.concat(frames, ignore_index=True)
    return df.sort_values("date").reset_index(drop=True)