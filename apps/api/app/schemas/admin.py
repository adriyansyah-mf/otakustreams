from datetime import datetime

from pydantic import BaseModel


class SourceOut(BaseModel):
    id: int
    kind: str
    name: str
    base_url: str
    list_url: str
    is_enabled: bool
    crawl_interval_minutes: int
    config_json: str
    last_crawled_at: datetime | None


class SourceCreateIn(BaseModel):
    kind: str
    name: str
    base_url: str
    list_url: str
    is_enabled: bool = True
    crawl_interval_minutes: int = 360
    config_json: str = "{}"


class SourceUpdateIn(BaseModel):
    name: str | None = None
    base_url: str | None = None
    list_url: str | None = None
    is_enabled: bool | None = None
    crawl_interval_minutes: int | None = None
    config_json: str | None = None


class AdminSummaryOut(BaseModel):
    users: int
    anime_titles: int
    manga_titles: int
    bookmarks: int
    crawl_jobs: int
    crawl_errors_24h: int

