from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class AnimeTitle(Base):
    __tablename__ = "anime_titles"
    __table_args__ = (UniqueConstraint("source_id", "source_slug", name="uq_anime_titles_source_slug"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id", ondelete="CASCADE"), index=True, nullable=False)
    source_slug: Mapped[str] = mapped_column(String(255), nullable=False)
    source_url: Mapped[str] = mapped_column(String(700), nullable=False)

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    alt_title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str | None] = mapped_column(String(80), nullable=True)
    score: Mapped[str | None] = mapped_column(String(40), nullable=True)
    synopsis: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(700), nullable=True)
    genres: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    extra: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    episodes: Mapped[list["AnimeEpisode"]] = relationship(back_populates="anime", cascade="all, delete-orphan")


class AnimeEpisode(Base):
    __tablename__ = "anime_episodes"
    __table_args__ = (UniqueConstraint("anime_id", "episode_number", name="uq_anime_episode_number"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    anime_id: Mapped[int] = mapped_column(ForeignKey("anime_titles.id", ondelete="CASCADE"), index=True, nullable=False)

    episode_number: Mapped[float] = mapped_column(nullable=False)
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source_url: Mapped[str] = mapped_column(String(700), nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # [{provider, quality, url, is_embed}]
    video_links: Mapped[list[dict] | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    anime: Mapped["AnimeTitle"] = relationship(back_populates="episodes")

