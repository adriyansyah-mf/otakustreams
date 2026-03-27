from datetime import datetime

from pydantic import BaseModel


class AnimeListItem(BaseModel):
    id: int
    title: str
    score: str | None
    thumbnail_url: str | None


class AnimeEpisodeOut(BaseModel):
    id: int
    episode_number: float
    title: str | None
    source_url: str
    video_links: list[dict] | None
    created_at: datetime


class AnimeDetailOut(BaseModel):
    id: int
    title: str
    alt_title: str | None
    status: str | None
    score: str | None
    synopsis: str | None
    thumbnail_url: str | None
    genres: list[str] | None
    source_url: str
    episodes: list[AnimeEpisodeOut]

