from datetime import datetime
import html

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.community import ContentComment, ContentRating
from app.models.user import User
from app.schemas.community import CommentCreateIn, CommentOut, RatingOut, RatingUpsertIn

router = APIRouter(prefix="/community", tags=["community"])
BLOCKED_WORDS = {"kontol", "memek", "anjing", "bangsat"}


def _sanitize_comment_body(raw: str) -> str:
    cleaned = html.escape((raw or "").strip())
    if len(cleaned) < 1:
        raise HTTPException(status_code=400, detail="Komentar kosong.")
    lowered = cleaned.lower()
    if any(w in lowered for w in BLOCKED_WORDS):
        raise HTTPException(status_code=400, detail="Komentar mengandung kata yang tidak diperbolehkan.")
    if lowered.count("http://") + lowered.count("https://") > 2:
        raise HTTPException(status_code=400, detail="Terlalu banyak link pada komentar.")
    return cleaned


def _is_comment_rate_limited(last_created_at: datetime | None, now: datetime, window_seconds: int = 15) -> bool:
    if not last_created_at:
        return False
    return (now - last_created_at).total_seconds() < window_seconds


@router.get("/comments", response_model=list[CommentOut])
def list_comments(
    kind: str = Query(...),
    entity_id: int = Query(..., ge=1),
    db: Session = Depends(get_db),
):
    rows = (
        db.execute(
            select(ContentComment, User.email)
            .join(User, User.id == ContentComment.user_id)
            .where(ContentComment.kind == kind, ContentComment.entity_id == entity_id, ContentComment.is_hidden == False)  # noqa: E712
            .order_by(ContentComment.id.desc())
            .limit(200)
        )
        .all()
    )
    return [
        CommentOut(
            id=i.id,
            user_id=i.user_id,
            user_email=email,
            kind=i.kind,
            entity_id=i.entity_id,
            body=i.body,
            is_hidden=i.is_hidden,
            created_at=i.created_at,
        )
        for i, email in rows
    ]


@router.post("/comments", response_model=CommentOut)
def add_comment(payload: CommentCreateIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if payload.kind not in {"anime", "manga"}:
        raise HTTPException(status_code=400, detail="Invalid kind")
    now = datetime.utcnow()
    last = db.execute(
        select(ContentComment)
        .where(ContentComment.user_id == user.id)
        .order_by(ContentComment.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    if _is_comment_rate_limited(last.created_at if last else None, now):
        raise HTTPException(status_code=429, detail="Terlalu cepat mengirim komentar. Coba lagi sebentar.")

    cleaned = _sanitize_comment_body(payload.body)

    item = ContentComment(
        user_id=user.id,
        kind=payload.kind,
        entity_id=payload.entity_id,
        body=cleaned,
        is_hidden=False,
        created_at=now,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return CommentOut(
        id=item.id,
        user_id=item.user_id,
        user_email=user.email,
        kind=item.kind,
        entity_id=item.entity_id,
        body=item.body,
        is_hidden=item.is_hidden,
        created_at=item.created_at,
    )


@router.get("/ratings", response_model=RatingOut)
def get_rating(
    kind: str = Query(...),
    entity_id: int = Query(..., ge=1),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if kind not in {"anime", "manga"}:
        raise HTTPException(status_code=400, detail="Invalid kind")
    avg_q = db.execute(
        select(func.avg(ContentRating.rating), func.count(ContentRating.id)).where(
            ContentRating.kind == kind, ContentRating.entity_id == entity_id
        )
    ).one()
    my = db.execute(
        select(ContentRating).where(
            ContentRating.kind == kind, ContentRating.entity_id == entity_id, ContentRating.user_id == user.id
        )
    ).scalar_one_or_none()
    return RatingOut(
        user_rating=my.rating if my else None,
        avg_rating=float(avg_q[0]) if avg_q and avg_q[0] is not None else None,
        total=int(avg_q[1] or 0),
    )


@router.post("/ratings", response_model=RatingOut)
def upsert_rating(payload: RatingUpsertIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if payload.kind not in {"anime", "manga"}:
        raise HTTPException(status_code=400, detail="Invalid kind")
    existing = db.execute(
        select(ContentRating).where(
            ContentRating.kind == payload.kind,
            ContentRating.entity_id == payload.entity_id,
            ContentRating.user_id == user.id,
        )
    ).scalar_one_or_none()
    now = datetime.utcnow()
    if existing:
        existing.rating = payload.rating
        existing.updated_at = now
        db.add(existing)
    else:
        db.add(
            ContentRating(
                user_id=user.id,
                kind=payload.kind,
                entity_id=payload.entity_id,
                rating=payload.rating,
                created_at=now,
                updated_at=now,
            )
        )
    db.commit()
    return get_rating(kind=payload.kind, entity_id=payload.entity_id, db=db, user=user)

