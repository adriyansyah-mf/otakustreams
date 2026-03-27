from datetime import datetime

from pydantic import BaseModel


class MangaListItem(BaseModel):
    id: int
    title: str
    thumbnail_url: str | None


class MangaChapterOut(BaseModel):
    id: int
    chapter_number: float
    title: str | None
    source_url: str
    page_images: list[str] | None
    created_at: datetime


class MangaChapterListItem(BaseModel):
    id: int
    manga_id: int
    chapter_number: float
    title: str | None
    created_at: datetime


class MangaDetailOut(BaseModel):
    id: int
    title: str
    status: str | None
    synopsis: str | None
    thumbnail_url: str | None
    genres: list[str] | None
    source_url: str
    chapters: list[MangaChapterOut]

