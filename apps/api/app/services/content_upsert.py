from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.anime import AnimeEpisode, AnimeTitle
from app.models.community import NotificationEvent, TitleFollow
from app.models.manga import MangaChapter, MangaTitle


def upsert_anime_title(
    db: Session,
    *,
    source_id: int,
    source_slug: str,
    source_url: str,
    title: str,
    thumbnail_url: str | None,
    synopsis: str | None,
    score: str | None,
    status: str | None,
    genres: list[str] | None,
    extra: dict | None = None,
) -> AnimeTitle:
    existing = db.execute(
        select(AnimeTitle).where(AnimeTitle.source_id == source_id, AnimeTitle.source_slug == source_slug)
    ).scalar_one_or_none()
    now = datetime.utcnow()
    if existing:
        existing.source_url = source_url
        existing.title = title
        existing.thumbnail_url = thumbnail_url
        existing.synopsis = synopsis
        existing.score = score
        existing.status = status
        existing.genres = genres
        existing.extra = extra
        existing.updated_at = now
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    item = AnimeTitle(
        source_id=source_id,
        source_slug=source_slug,
        source_url=source_url,
        title=title,
        thumbnail_url=thumbnail_url,
        synopsis=synopsis,
        score=score,
        status=status,
        genres=genres,
        extra=extra,
        updated_at=now,
        created_at=now,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def upsert_anime_episode(
    db: Session,
    *,
    anime_id: int,
    episode_number: float,
    source_url: str,
    title: str | None,
    video_links: list[dict] | None,
) -> AnimeEpisode:
    existing = db.execute(
        select(AnimeEpisode).where(AnimeEpisode.anime_id == anime_id, AnimeEpisode.episode_number == episode_number)
    ).scalar_one_or_none()
    if existing:
        existing.source_url = source_url
        existing.title = title
        existing.video_links = video_links
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    ep = AnimeEpisode(
        anime_id=anime_id,
        episode_number=episode_number,
        source_url=source_url,
        title=title,
        video_links=video_links,
        created_at=datetime.utcnow(),
    )
    db.add(ep)
    db.commit()
    db.refresh(ep)
    _create_follow_notifications_for_new_episode(db, anime_id=anime_id, episode=ep)
    return ep


def upsert_manga_title(
    db: Session,
    *,
    source_id: int,
    source_slug: str,
    source_url: str,
    title: str,
    thumbnail_url: str | None,
    synopsis: str | None,
    status: str | None,
    genres: list[str] | None,
    extra: dict | None = None,
) -> MangaTitle:
    existing = db.execute(
        select(MangaTitle).where(MangaTitle.source_id == source_id, MangaTitle.source_slug == source_slug)
    ).scalar_one_or_none()
    now = datetime.utcnow()
    if existing:
        existing.source_url = source_url
        existing.title = title
        existing.thumbnail_url = thumbnail_url
        existing.synopsis = synopsis
        existing.status = status
        existing.genres = genres
        existing.extra = extra
        existing.updated_at = now
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    item = MangaTitle(
        source_id=source_id,
        source_slug=source_slug,
        source_url=source_url,
        title=title,
        thumbnail_url=thumbnail_url,
        synopsis=synopsis,
        status=status,
        genres=genres,
        extra=extra,
        updated_at=now,
        created_at=now,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def upsert_manga_chapter(
    db: Session,
    *,
    manga_id: int,
    chapter_number: float,
    source_url: str,
    title: str | None,
    page_images: list[str] | None,
) -> MangaChapter:
    existing = db.execute(
        select(MangaChapter).where(MangaChapter.manga_id == manga_id, MangaChapter.chapter_number == chapter_number)
    ).scalar_one_or_none()
    if existing:
        existing.source_url = source_url
        existing.title = title
        existing.page_images = page_images
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing

    ch = MangaChapter(
        manga_id=manga_id,
        chapter_number=chapter_number,
        source_url=source_url,
        title=title,
        page_images=page_images,
        created_at=datetime.utcnow(),
    )
    db.add(ch)
    db.commit()
    db.refresh(ch)
    _create_follow_notifications_for_new_chapter(db, manga_id=manga_id, chapter=ch)
    return ch


def _create_follow_notifications_for_new_episode(db: Session, *, anime_id: int, episode: AnimeEpisode) -> None:
    follows = (
        db.execute(
            select(TitleFollow).where(TitleFollow.kind == "anime", TitleFollow.entity_id == anime_id)
        )
        .scalars()
        .all()
    )
    if not follows:
        return
    anime = db.execute(select(AnimeTitle).where(AnimeTitle.id == anime_id)).scalar_one_or_none()
    anime_title = anime.title if anime else f"Anime {anime_id}"
    now = datetime.utcnow()
    for f in follows:
        db.add(
            NotificationEvent(
                user_id=f.user_id,
                kind="new_episode",
                title_kind="anime",
                title_id=anime_id,
                entity_id=episode.id,
                message=f"Episode baru {anime_title}: EP {episode.episode_number}",
                is_read=False,
                meta={"episode_id": episode.id, "anime_id": anime_id},
                created_at=now,
            )
        )
    db.commit()


def _create_follow_notifications_for_new_chapter(db: Session, *, manga_id: int, chapter: MangaChapter) -> None:
    follows = (
        db.execute(
            select(TitleFollow).where(TitleFollow.kind == "manga", TitleFollow.entity_id == manga_id)
        )
        .scalars()
        .all()
    )
    if not follows:
        return
    manga = db.execute(select(MangaTitle).where(MangaTitle.id == manga_id)).scalar_one_or_none()
    manga_title = manga.title if manga else f"Manga {manga_id}"
    now = datetime.utcnow()
    for f in follows:
        db.add(
            NotificationEvent(
                user_id=f.user_id,
                kind="new_chapter",
                title_kind="manga",
                title_id=manga_id,
                entity_id=chapter.id,
                message=f"Chapter baru {manga_title}: CH {chapter.chapter_number}",
                is_read=False,
                meta={"chapter_id": chapter.id, "manga_id": manga_id},
                created_at=now,
            )
        )
    db.commit()

