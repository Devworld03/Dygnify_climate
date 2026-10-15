import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

log = logging.getLogger(__name__)

client = AsyncIOMotorClient(settings.mongo_uri, serverSelectionTimeoutMS=5000)
db = client[settings.db_name]


async def ensure_indexes() -> None:
    try:
        await db.raw_daily.create_index([("region_key", 1), ("date", 1)], unique=True)
        await db.events.create_index([("region_key", 1), ("start", 1)])
        await db.yearly_stats.create_index([("region_key", 1), ("year", 1)], unique=True)
        await db.cache_meta.create_index("region_key", unique=True)
        await db.cache_meta.create_index(
            "fetched_at", expireAfterSeconds=settings.cache_ttl_days * 86400
        )
    except Exception as e:  # Mongo not reachable yet
        log.warning("Could not create indexes: %s", e)
