from datetime import date

from pydantic import BaseModel, Field


class PageViewTrackIn(BaseModel):
    path: str = Field(min_length=1, max_length=500)
    session_id: str | None = Field(default=None, max_length=64)


class DailyVisitPointOut(BaseModel):
    day: date
    count: int


class PathCountOut(BaseModel):
    path: str
    count: int


class AdminVisitsReportOut(BaseModel):
    days: int
    series: list[DailyVisitPointOut]
    top_paths: list[PathCountOut]
    total_in_period: int
    unique_sessions_in_period: int
