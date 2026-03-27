from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.bookmark import Bookmark
from app.schemas.bookmark import BookmarkOut, BookmarkToggleIn

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


@router.get("", response_model=list[BookmarkOut])
def list_bookmarks(db: Session = Depends(get_db), user=Depends(get_current_user)):
    items = db.execute(select(Bookmark).where(Bookmark.user_id == user.id)).scalars().all()
    return [BookmarkOut(id=b.id, kind=b.kind, entity_id=b.entity_id) for b in items]


@router.post("/toggle", response_model=dict)
def toggle_bookmark(payload: BookmarkToggleIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    existing = db.execute(
        select(Bookmark).where(
            Bookmark.user_id == user.id, Bookmark.kind == payload.kind, Bookmark.entity_id == payload.entity_id
        )
    ).scalar_one_or_none()
    if existing:
        db.execute(delete(Bookmark).where(Bookmark.id == existing.id))
        db.commit()
        return {"bookmarked": False}

    b = Bookmark(user_id=user.id, kind=payload.kind, entity_id=payload.entity_id)
    db.add(b)
    db.commit()
    return {"bookmarked": True}

