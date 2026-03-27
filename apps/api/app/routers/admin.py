from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.session import get_db
from app.models.anime import AnimeTitle
from app.models.bookmark import Bookmark
from app.models.crawl import CrawlJob, CrawlLog
from app.models.community import BrokenLinkReport, ContentComment, NotificationEvent
from app.models.manga import MangaTitle
from app.models.source import Source, SourceKind
from app.models.user import User
from app.schemas.admin import AdminSummaryOut, SourceCreateIn, SourceOut, SourceUpdateIn
from app.worker.tasks import crawl_source
from app.crawler.flexible import anime as flex_anime
from app.crawler.flexible import manga as flex_manga
from app.schemas.flexible import AnimeFlexTestIn, AnimeFlexTestOut, MangaFlexTestIn, MangaFlexTestOut
from dataclasses import asdict

router = APIRouter(prefix="/admin", tags=["admin"])


class BulkModerateCommentsIn(BaseModel):
    comment_ids: list[int] = Field(default_factory=list, min_length=1, max_length=500)
    is_hidden: bool


@router.get("/summary", response_model=AdminSummaryOut)
def summary(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    now = datetime.utcnow()
    since = now - timedelta(hours=24)

    users = db.execute(select(func.count()).select_from(User)).scalar_one()
    anime_titles = db.execute(select(func.count()).select_from(AnimeTitle)).scalar_one()
    manga_titles = db.execute(select(func.count()).select_from(MangaTitle)).scalar_one()
    bookmarks = db.execute(select(func.count()).select_from(Bookmark)).scalar_one()
    crawl_jobs = db.execute(select(func.count()).select_from(CrawlJob)).scalar_one()
    crawl_errors_24h = (
        db.execute(
            select(func.count())
            .select_from(CrawlLog)
            .where(CrawlLog.level == "error", CrawlLog.created_at >= since)
        ).scalar_one()
    )

    return AdminSummaryOut(
        users=users,
        anime_titles=anime_titles,
        manga_titles=manga_titles,
        bookmarks=bookmarks,
        crawl_jobs=crawl_jobs,
        crawl_errors_24h=crawl_errors_24h,
    )


@router.get("/sources", response_model=list[SourceOut])
def list_sources(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    items = db.execute(select(Source).order_by(Source.kind.asc(), Source.id.asc())).scalars().all()
    return [
        SourceOut(
            id=s.id,
            kind=s.kind,
            name=s.name,
            base_url=s.base_url,
            list_url=s.list_url,
            is_enabled=s.is_enabled,
            crawl_interval_minutes=s.crawl_interval_minutes,
            config_json=s.config_json,
            last_crawled_at=s.last_crawled_at,
        )
        for s in items
    ]


@router.post("/sources", response_model=SourceOut, status_code=status.HTTP_201_CREATED)
def create_source(payload: SourceCreateIn, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    try:
        kind = SourceKind(payload.kind)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid kind")

    s = Source(
        kind=kind.value,
        name=payload.name,
        base_url=payload.base_url,
        list_url=payload.list_url,
        is_enabled=payload.is_enabled,
        crawl_interval_minutes=payload.crawl_interval_minutes,
        config_json=payload.config_json,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return SourceOut(
        id=s.id,
        kind=s.kind,
        name=s.name,
        base_url=s.base_url,
        list_url=s.list_url,
        is_enabled=s.is_enabled,
        crawl_interval_minutes=s.crawl_interval_minutes,
        config_json=s.config_json,
        last_crawled_at=s.last_crawled_at,
    )


@router.patch("/sources/{source_id}", response_model=SourceOut)
def update_source(
    source_id: int, payload: SourceUpdateIn, db: Session = Depends(get_db), _admin=Depends(require_admin)
):
    s = db.execute(select(Source).where(Source.id == source_id)).scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=404, detail="Source not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(s, field, value)
    db.add(s)
    db.commit()
    db.refresh(s)
    return SourceOut(
        id=s.id,
        kind=s.kind,
        name=s.name,
        base_url=s.base_url,
        list_url=s.list_url,
        is_enabled=s.is_enabled,
        crawl_interval_minutes=s.crawl_interval_minutes,
        config_json=s.config_json,
        last_crawled_at=s.last_crawled_at,
    )


@router.post("/crawl/trigger", response_model=dict)
def trigger_crawl(source_id: int, _admin=Depends(require_admin)):
    crawl_source.delay(source_id)
    return {"queued": True, "source_id": source_id}


@router.get("/jobs", response_model=list[dict])
def list_jobs(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    items = db.execute(select(CrawlJob).order_by(CrawlJob.id.desc()).limit(50)).scalars().all()
    return [
        {
            "id": j.id,
            "source_id": j.source_id,
            "status": j.status,
            "started_at": j.started_at.isoformat() if j.started_at else None,
            "finished_at": j.finished_at.isoformat() if j.finished_at else None,
            "stats": j.stats,
            "error": j.error,
        }
        for j in items
    ]


@router.get("/logs", response_model=list[dict])
def list_logs(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    items = db.execute(select(CrawlLog).order_by(CrawlLog.id.desc()).limit(100)).scalars().all()
    return [
        {
            "id": l.id,
            "source_id": l.source_id,
            "level": l.level,
            "message": l.message,
            "created_at": l.created_at.isoformat(),
            "meta": l.meta,
        }
        for l in items
    ]


@router.post("/sources/{source_id}/test", response_model=AnimeFlexTestOut | MangaFlexTestOut)
def test_flexible_source(
    source_id: int,
    payload: AnimeFlexTestIn | MangaFlexTestIn,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    source = db.execute(select(Source).where(Source.id == source_id)).scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    if source.kind == "anime":
        if not isinstance(payload, AnimeFlexTestIn):
            raise HTTPException(status_code=400, detail="Payload must be AnimeFlexTestIn for anime sources")
        cfg = flex_anime.load_config(source.config_json)
        if cfg.get("mode") != "flexible":
            cfg["mode"] = "flexible"

        detail = flex_anime.crawl_anime_detail(str(payload.detail_url), source.base_url.rstrip("/"), cfg)
        episode = None
        if payload.episode_url:
            episode = flex_anime.crawl_episode_detail(str(payload.episode_url), source.base_url.rstrip("/"), cfg)

        return AnimeFlexTestOut(
            detail=asdict(detail),
            episode=asdict(episode) if episode else None,
        )

    if source.kind == "manga":
        if not isinstance(payload, MangaFlexTestIn):
            raise HTTPException(status_code=400, detail="Payload must be MangaFlexTestIn for manga sources")
        cfg = flex_manga.load_config(source.config_json)
        if cfg.get("mode") != "flexible":
            cfg["mode"] = "flexible"

        detail = flex_manga.crawl_manga_detail(str(payload.detail_url), source.base_url.rstrip("/"), cfg)
        chapter = None
        if payload.chapter_url:
            chapter = flex_manga.crawl_chapter_detail(str(payload.chapter_url), source.base_url.rstrip("/"), cfg)

        return MangaFlexTestOut(
            detail=asdict(detail),
            chapter=asdict(chapter) if chapter else None,
        )

    raise HTTPException(status_code=400, detail="Unsupported source kind")


@router.get("/community/comments", response_model=list[dict])
def list_comments_for_moderation(
    kind: str | None = None,
    is_hidden: bool | None = None,
    q: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    stmt = select(ContentComment).order_by(ContentComment.id.desc())
    if kind:
        stmt = stmt.where(ContentComment.kind == kind)
    if is_hidden is not None:
        stmt = stmt.where(ContentComment.is_hidden == is_hidden)
    if q:
        stmt = stmt.where(ContentComment.body.ilike(f"%{q}%"))
    items = db.execute(stmt.offset(max(0, offset)).limit(max(1, min(limit, 200)))).scalars().all()
    return [
        {
            "id": c.id,
            "user_id": c.user_id,
            "kind": c.kind,
            "entity_id": c.entity_id,
            "body": c.body,
            "is_hidden": c.is_hidden,
            "created_at": c.created_at.isoformat(),
        }
        for c in items
    ]


@router.patch("/community/comments/{comment_id}", response_model=dict)
def moderate_comment(comment_id: int, is_hidden: bool, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    c = db.execute(select(ContentComment).where(ContentComment.id == comment_id)).scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Comment not found")
    c.is_hidden = is_hidden
    db.add(c)
    db.commit()
    return {"ok": True}


@router.patch("/community/comments/bulk", response_model=dict)
def bulk_moderate_comments(
    payload: BulkModerateCommentsIn,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    comment_ids = list({cid for cid in payload.comment_ids if cid > 0})
    if not comment_ids:
        raise HTTPException(status_code=400, detail="comment_ids must not be empty")

    items = db.execute(select(ContentComment).where(ContentComment.id.in_(comment_ids))).scalars().all()
    if not items:
        return {"ok": True, "updated": 0}

    for c in items:
        c.is_hidden = payload.is_hidden
        db.add(c)
    db.commit()
    return {"ok": True, "updated": len(items)}


@router.get("/notifications/health", response_model=dict)
def notifications_health(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    total = db.execute(select(func.count()).select_from(NotificationEvent)).scalar_one()
    unread = db.execute(
        select(func.count()).select_from(NotificationEvent).where(NotificationEvent.is_read == False)  # noqa: E712
    ).scalar_one()
    open_reports = db.execute(
        select(func.count()).select_from(BrokenLinkReport).where(BrokenLinkReport.status == "open")
    ).scalar_one()
    return {"total_notifications": total, "unread_notifications": unread, "open_broken_reports": open_reports}

