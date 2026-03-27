from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import asc, select
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.session import get_db
from app.models.ads import Ad
from app.schemas.ads import AdCreateIn, AdOut, AdUpdateIn

router = APIRouter(prefix="/ads", tags=["ads"])
admin_router = APIRouter(prefix="/admin/ads", tags=["admin-ads"])


@router.get("", response_model=list[AdOut])
def list_ads(placement: str, db: Session = Depends(get_db)):
    items = db.execute(
        select(Ad)
        .where(Ad.placement == placement, Ad.is_enabled == True)  # noqa: E712
        .order_by(asc(Ad.sort_order), asc(Ad.id))
    ).scalars().all()
    return [AdOut(id=a.id, placement=a.placement, html=a.html, is_enabled=a.is_enabled, sort_order=a.sort_order) for a in items]


@admin_router.get("", response_model=list[AdOut])
def admin_list_ads(db: Session = Depends(get_db), _admin=Depends(require_admin)):
    items = db.execute(select(Ad).order_by(asc(Ad.sort_order), asc(Ad.id))).scalars().all()
    return [AdOut(id=a.id, placement=a.placement, html=a.html, is_enabled=a.is_enabled, sort_order=a.sort_order) for a in items]


@admin_router.post("", response_model=AdOut, status_code=status.HTTP_201_CREATED)
def admin_create_ad(payload: AdCreateIn, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    ad = Ad(
        placement=payload.placement,
        html=payload.html,
        is_enabled=payload.is_enabled,
        sort_order=payload.sort_order,
    )
    db.add(ad)
    db.commit()
    db.refresh(ad)
    return AdOut(id=ad.id, placement=ad.placement, html=ad.html, is_enabled=ad.is_enabled, sort_order=ad.sort_order)


@admin_router.patch("/{ad_id}", response_model=AdOut)
def admin_update_ad(ad_id: int, payload: AdUpdateIn, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    ad = db.execute(select(Ad).where(Ad.id == ad_id)).scalar_one_or_none()
    if not ad:
        raise HTTPException(status_code=404, detail="Ad not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(ad, field, value)
    db.add(ad)
    db.commit()
    db.refresh(ad)
    return AdOut(id=ad.id, placement=ad.placement, html=ad.html, is_enabled=ad.is_enabled, sort_order=ad.sort_order)


@admin_router.delete("/{ad_id}", response_model=dict)
def admin_delete_ad(ad_id: int, db: Session = Depends(get_db), _admin=Depends(require_admin)):
    ad = db.execute(select(Ad).where(Ad.id == ad_id)).scalar_one_or_none()
    if not ad:
        return {"deleted": False}
    db.delete(ad)
    db.commit()
    return {"deleted": True}

