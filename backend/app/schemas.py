from datetime import date
from typing import Literal
from pydantic import BaseModel, Field, model_validator
from app.config import settings


class AnalyzeRequest(BaseModel):
    hazard: Literal["heatwave"] = "heatwave"
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    start_year: int
    end_year: int

    @model_validator(mode="after")
    def check_years(self):
        last_full_year = date.today().year - 1
        if self.start_year < settings.min_year:
            raise ValueError(f"start_year must be >= {settings.min_year}")
        if self.end_year > last_full_year:
            raise ValueError(f"end_year must be <= {last_full_year}")
        if self.end_year < self.start_year:
            raise ValueError("end_year must be >= start_year")
        if self.end_year - self.start_year + 1 > settings.max_year_span:
            raise ValueError(f"range too large (max {settings.max_year_span} years)")
        return self
