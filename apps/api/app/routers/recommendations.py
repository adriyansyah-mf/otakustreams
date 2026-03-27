from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.anime import AnimeTitle
from app.models.bookmark import Bookmark
from app.models.community import WatchProgress
from app.models.history import ReadHistory, WatchHistory
from app.models.manga import MangaTitle

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("", response_model=dict)
def recommendations(db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Lightweight heuristic: based on recent bookmark/history kinds.
    bookmark_rows = db.execute(select(Bookmark).where(Bookmark.user_id == user.id)).scalars().all()
    has_anime = any(b.kind == "anime" for b in bookmark_rows) or bool(
        db.execute(select(WatchHistory).where(WatchHistory.user_id == user.id).limit(1)).scalar_one_or_none()
    ) or bool(
        db.execute(select(WatchProgress).where(WatchProgress.user_id == user.id).limit(1)).scalar_one_or_none()
    )
    has_manga = any(b.kind == "manga" for b in bookmark_rows) or bool(
        db.execute(select(ReadHistory).where(ReadHistory.user_id == user.id).limit(1)).scalar_one_or_none()
    )

    anime = []
    manga = []
    if has_anime:
        anime_rows = db.execute(select(AnimeTitle).order_by(desc(AnimeTitle.updated_at)).limit(12)).scalars().all()
        anime = [{"id": a.id, "title": a.title, "thumbnail_url": a.thumbnail_url} for a in anime_rows]
    if has_manga:
        manga_rows = db.execute(select(MangaTitle).order_by(desc(MangaTitle.updated_at)).limit(12)).scalars().all()
        manga = [{"id": m.id, "title": m.title, "thumbnail_url": m.thumbnail_url} for m in manga_rows]

    # fallback mixed recommendations
    if not anime:
        anime_rows = db.execute(select(AnimeTitle).order_by(desc(AnimeTitle.updated_at)).limit(6)).scalars().all()
        anime = [{"id": a.id, "title": a.title, "thumbnail_url": a.thumbnail_url} for a in anime_rows]
    if not manga:
        manga_rows = db.execute(select(MangaTitle).order_by(desc(MangaTitle.updated_at)).limit(6)).scalars().all()
        manga = [{"id": m.id, "title": m.title, "thumbnail_url": m.thumbnail_url} for m in manga_rows]

    return {"anime": anime, "manga": manga}

