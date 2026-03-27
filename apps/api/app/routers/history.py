from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.community import WatchProgress
from app.models.anime import AnimeEpisode, AnimeTitle
from app.models.history import ReadHistory, WatchHistory
from app.models.manga import MangaChapter, MangaTitle

router = APIRouter(prefix="/history", tags=["history"])


@router.post("/watch", response_model=dict)
def mark_watched(episode_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db.execute(delete(WatchHistory).where(WatchHistory.user_id == user.id, WatchHistory.episode_id == episode_id))
    db.add(WatchHistory(user_id=user.id, episode_id=episode_id, watched_at=datetime.utcnow()))
    db.commit()
    return {"ok": True}


@router.post("/read", response_model=dict)
def mark_read(chapter_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    db.execute(delete(ReadHistory).where(ReadHistory.user_id == user.id, ReadHistory.chapter_id == chapter_id))
    db.add(ReadHistory(user_id=user.id, chapter_id=chapter_id, read_at=datetime.utcnow()))
    db.commit()
    return {"ok": True}


@router.get("/watch", response_model=list[dict])
def list_watch(db: Session = Depends(get_db), user=Depends(get_current_user)):
    items = (
        db.execute(select(WatchHistory).where(WatchHistory.user_id == user.id).order_by(WatchHistory.watched_at.desc()).limit(100))
        .scalars()
        .all()
    )
    return [{"episode_id": i.episode_id, "watched_at": i.watched_at.isoformat()} for i in items]


@router.get("/read", response_model=list[dict])
def list_read(db: Session = Depends(get_db), user=Depends(get_current_user)):
    items = (
        db.execute(select(ReadHistory).where(ReadHistory.user_id == user.id).order_by(ReadHistory.read_at.desc()).limit(100))
        .scalars()
        .all()
    )
    return [{"chapter_id": i.chapter_id, "read_at": i.read_at.isoformat()} for i in items]


@router.get("/watch/expanded", response_model=list[dict])
def list_watch_expanded(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.execute(
        select(WatchHistory, AnimeEpisode, AnimeTitle)
        .join(AnimeEpisode, AnimeEpisode.id == WatchHistory.episode_id)
        .join(AnimeTitle, AnimeTitle.id == AnimeEpisode.anime_id)
        .where(WatchHistory.user_id == user.id)
        .order_by(WatchHistory.watched_at.desc())
        .limit(20)
    ).all()
    return [
        {
            "episode_id": wh.episode_id,
            "anime_id": a.id,
            "anime_title": a.title,
            "episode_number": ep.episode_number,
            "episode_title": ep.title,
            "watched_at": wh.watched_at.isoformat(),
        }
        for wh, ep, a in rows
    ]


@router.get("/read/expanded", response_model=list[dict])
def list_read_expanded(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.execute(
        select(ReadHistory, MangaChapter, MangaTitle)
        .join(MangaChapter, MangaChapter.id == ReadHistory.chapter_id)
        .join(MangaTitle, MangaTitle.id == MangaChapter.manga_id)
        .where(ReadHistory.user_id == user.id)
        .order_by(ReadHistory.read_at.desc())
        .limit(20)
    ).all()
    return [
        {
            "chapter_id": rh.chapter_id,
            "manga_id": m.id,
            "manga_title": m.title,
            "chapter_number": ch.chapter_number,
            "chapter_title": ch.title,
            "read_at": rh.read_at.isoformat(),
        }
        for rh, ch, m in rows
    ]


@router.post("/progress", response_model=dict)
def upsert_progress(
    episode_id: int,
    last_second: int,
    duration: int | None = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    existing = db.execute(
        select(WatchProgress).where(WatchProgress.user_id == user.id, WatchProgress.episode_id == episode_id)
    ).scalar_one_or_none()
    if existing:
        existing.last_second = max(0, last_second)
        existing.duration = duration
        existing.updated_at = datetime.utcnow()
        db.add(existing)
    else:
        db.add(
            WatchProgress(
                user_id=user.id,
                episode_id=episode_id,
                last_second=max(0, last_second),
                duration=duration,
                updated_at=datetime.utcnow(),
            )
        )
    db.commit()
    return {"ok": True}


@router.get("/progress", response_model=list[dict])
def list_progress(db: Session = Depends(get_db), user=Depends(get_current_user)):
    items = (
        db.execute(select(WatchProgress).where(WatchProgress.user_id == user.id).order_by(WatchProgress.updated_at.desc()).limit(100))
        .scalars()
        .all()
    )
    return [
        {
            "episode_id": i.episode_id,
            "last_second": i.last_second,
            "duration": i.duration,
            "updated_at": i.updated_at.isoformat(),
        }
        for i in items
    ]

