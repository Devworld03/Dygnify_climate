from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    mongo_uri: str = "mongodb://localhost:27017"
    db_name: str = "climate_hazards"
    cors_origins: list[str] = ["http://localhost:5173"]

    # Heatwave definition
    baseline_start: int = 1991
    baseline_end: int = 2020
    percentile: float = 95.0
    window_days: int = 15          # +/- window around each calendar day
    min_duration_days: int = 3

    # Input limits
    min_year: int = 1950
    max_box_deg: float = 2.0
    max_year_span: int = 80

    # Caching / rate limit
    cache_ttl_days: int = 30
    rate_limit: str = "30/minute"


settings = Settings()
