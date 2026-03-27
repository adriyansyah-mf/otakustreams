from pydantic import BaseModel, HttpUrl


class AnimeFlexTestIn(BaseModel):
    detail_url: HttpUrl
    episode_url: HttpUrl | None = None


class AnimeFlexTestOut(BaseModel):
    detail: dict
    episode: dict | None = None


class MangaFlexTestIn(BaseModel):
    detail_url: HttpUrl
    chapter_url: HttpUrl | None = None


class MangaFlexTestOut(BaseModel):
    detail: dict
    chapter: dict | None = None

