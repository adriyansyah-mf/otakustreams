from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.community import NotificationEvent, TitleFollow
from app.schemas.community import FollowToggleIn, NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _normalize_feed_params(limit: int, offset: int) -> tuple[int, int]:
    safe_limit = max(1, min(limit, 100))
    safe_offset = max(0, offset)
    return safe_limit, safe_offset


@router.post("/follow", response_model=dict)
def follow_toggle(payload: FollowToggleIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if payload.kind not in {"anime", "manga"}:
        raise HTTPException(status_code=400, detail="Invalid kind")
    existing = db.execute(
        select(TitleFollow).where(
            TitleFollow.user_id == user.id,
            TitleFollow.kind == payload.kind,
            TitleFollow.entity_id == payload.entity_id,
        )
    ).scalar_one_or_none()
    if existing:
        db.delete(existing)
        db.commit()
        return {"following": False}
    db.add(
        TitleFollow(
            user_id=user.id,
            kind=payload.kind,
            entity_id=payload.entity_id,
            created_at=datetime.utcnow(),
        )
    )
    db.commit()
    return {"following": True}


@router.get("/feed", response_model=list[NotificationOut])
def notification_feed(
    only_unread: bool = Query(default=False),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    limit, offset = _normalize_feed_params(limit=limit, offset=offset)
    stmt = select(NotificationEvent).where(NotificationEvent.user_id == user.id)
    if only_unread:
        stmt = stmt.where(NotificationEvent.is_read == False)  # noqa: E712
    items = db.execute(stmt.order_by(NotificationEvent.id.desc()).offset(offset).limit(limit)).scalars().all()
    return [
        NotificationOut(
            id=i.id,
            kind=i.kind,
            title_kind=i.title_kind,
            title_id=i.title_id,
            entity_id=i.entity_id,
            message=i.message,
            is_read=i.is_read,
            created_at=i.created_at,
        )
        for i in items
    ]


@router.post("/{notification_id}/read", response_model=dict)
def mark_read(notification_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = db.execute(
        select(NotificationEvent).where(NotificationEvent.id == notification_id, NotificationEvent.user_id == user.id)
    ).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    item.is_read = True
    db.add(item)
    db.commit()
    return {"ok": True}


@router.post("/read-all", response_model=dict)
def mark_all_read(db: Session = Depends(get_db), user=Depends(get_current_user)):
    items = db.execute(
        select(NotificationEvent).where(NotificationEvent.user_id == user.id, NotificationEvent.is_read == False)  # noqa: E712
    ).scalars().all()
    for item in items:
        item.is_read = True
        db.add(item)
    db.commit()
    return {"ok": True, "updated": len(items)}

