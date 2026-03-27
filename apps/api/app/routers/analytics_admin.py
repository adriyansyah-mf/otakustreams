from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.session import get_db
from app.models.anime import AnimeEpisode, AnimeTitle
from app.models.history import ReadHistory, WatchHistory
from app.models.manga import MangaChapter, MangaTitle
from app.models.bookmark import Bookmark
from app.models.community import BrokenLinkReport, ContentComment, ContentRating, NotificationEvent
from app.schemas.analytics_admin import AdminAnalyticsOverviewOut, TopItemOut

router = APIRouter(prefix="/admin/analytics", tags=["admin-analytics"])


@router.get("/overview", response_model=AdminAnalyticsOverviewOut)
def overview(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    now = datetime.utcnow()
    since_24h = now - timedelta(hours=24)

    watch_24h = (
        db.execute(select(func.count()).select_from(WatchHistory).where(WatchHistory.watched_at >= since_24h))
        .scalar_one()
    )
    read_24h = (
        db.execute(select(func.count()).select_from(ReadHistory).where(ReadHistory.read_at >= since_24h))
        .scalar_one()
    )
    bookmarks = db.execute(select(func.count()).select_from(Bookmark)).scalar_one()
    comments_24h = (
        db.execute(select(func.count()).select_from(ContentComment).where(ContentComment.created_at >= since_24h))
        .scalar_one()
    )
    ratings_24h = (
        db.execute(select(func.count()).select_from(ContentRating).where(ContentRating.created_at >= since_24h))
        .scalar_one()
    )
    reports_open = (
        db.execute(select(func.count()).select_from(BrokenLinkReport).where(BrokenLinkReport.status == "open"))
        .scalar_one()
    )
    reports_24h = (
        db.execute(select(func.count()).select_from(BrokenLinkReport).where(BrokenLinkReport.created_at >= since_24h))
        .scalar_one()
    )
    notifications_24h = (
        db.execute(select(func.count()).select_from(NotificationEvent).where(NotificationEvent.created_at >= since_24h))
        .scalar_one()
    )
    notifications_unread = (
        db.execute(
            select(func.count()).select_from(NotificationEvent).where(NotificationEvent.is_read == False)  # noqa: E712
        ).scalar_one()
    )

    most_watched_titles_rows = db.execute(
        select(AnimeTitle.title, func.count(WatchHistory.id).label("c"))
        .select_from(WatchHistory)
        .join(AnimeEpisode, WatchHistory.episode_id == AnimeEpisode.id)
        .join(AnimeTitle, AnimeEpisode.anime_id == AnimeTitle.id)
        .group_by(AnimeTitle.title)
        .order_by(func.count(WatchHistory.id).desc())
        .limit(5)
    ).all()

    most_read_titles_rows = db.execute(
        select(MangaTitle.title, func.count(ReadHistory.id).label("c"))
        .select_from(ReadHistory)
        .join(MangaChapter, ReadHistory.chapter_id == MangaChapter.id)
        .join(MangaTitle, MangaChapter.manga_id == MangaTitle.id)
        .group_by(MangaTitle.title)
        .order_by(func.count(ReadHistory.id).desc())
        .limit(5)
    ).all()

    return AdminAnalyticsOverviewOut(
        watch_24h=watch_24h,
        read_24h=read_24h,
        bookmarks=bookmarks,
        comments_24h=comments_24h,
        ratings_24h=ratings_24h,
        reports_open=reports_open,
        reports_24h=reports_24h,
        notifications_24h=notifications_24h,
        notifications_unread=notifications_unread,
        most_watched_titles=[TopItemOut(title=r[0], count=int(r[1])) for r in most_watched_titles_rows if r[0]] ,
        most_read_titles=[TopItemOut(title=r[0], count=int(r[1])) for r in most_read_titles_rows if r[0]] ,
        generated_at=now,
    )

