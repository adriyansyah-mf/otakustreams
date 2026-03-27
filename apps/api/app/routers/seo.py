from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.db.session import get_db
from app.models.seo import SeoSettings
from app.schemas.seo import SeoSettingsOut, SeoSettingsUpdateIn

router = APIRouter(prefix="/seo", tags=["seo"])
admin_router = APIRouter(prefix="/admin/seo", tags=["admin-seo"])


@router.get("/settings", response_model=SeoSettingsOut)
def get_settings(db: Session = Depends(get_db)):
    row = db.execute(select(SeoSettings).where(SeoSettings.id == 1)).scalar_one_or_none()
    if row:
        return SeoSettingsOut(site_title=row.site_title, site_description=row.site_description, og_image_url=row.og_image_url)
    # default fallback
    return SeoSettingsOut(
        site_title="Otakunesia",
        site_description="Nonton anime sub indo, baca manga, dan baca komik online.",
        og_image_url=None,
    )


@admin_router.patch("/settings", response_model=SeoSettingsOut)
def update_settings(
    payload: SeoSettingsUpdateIn,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    row = db.execute(select(SeoSettings).where(SeoSettings.id == 1)).scalar_one_or_none()
    if not row:
        row = SeoSettings(id=1)
        db.add(row)
    row.site_title = payload.site_title
    row.site_description = payload.site_description
    row.og_image_url = payload.og_image_url
    db.add(row)
    db.commit()
    db.refresh(row)
    return SeoSettingsOut(site_title=row.site_title, site_description=row.site_description, og_image_url=row.og_image_url)

