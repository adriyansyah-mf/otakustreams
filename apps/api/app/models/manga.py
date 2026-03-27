from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MangaTitle(Base):
    __tablename__ = "manga_titles"
    __table_args__ = (UniqueConstraint("source_id", "source_slug", name="uq_manga_titles_source_slug"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id", ondelete="CASCADE"), index=True, nullable=False)
    source_slug: Mapped[str] = mapped_column(String(255), nullable=False)
    source_url: Mapped[str] = mapped_column(String(700), nullable=False)

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    synopsis: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str | None] = mapped_column(String(80), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(700), nullable=True)
    genres: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    extra: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    chapters: Mapped[list["MangaChapter"]] = relationship(back_populates="manga", cascade="all, delete-orphan")


class MangaChapter(Base):
    __tablename__ = "manga_chapters"
    __table_args__ = (UniqueConstraint("manga_id", "chapter_number", name="uq_manga_chapter_number"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    manga_id: Mapped[int] = mapped_column(ForeignKey("manga_titles.id", ondelete="CASCADE"), index=True, nullable=False)

    chapter_number: Mapped[float] = mapped_column(nullable=False)
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_url: Mapped[str] = mapped_column(String(700), nullable=False)
    page_images: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    manga: Mapped["MangaTitle"] = relationship(back_populates="chapters")

