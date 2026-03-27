from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.community import BrokenLinkReport
from app.schemas.community import BrokenLinkReportIn

router = APIRouter(prefix="/reports", tags=["reports"])
admin_router = APIRouter(prefix="/admin/reports", tags=["admin-reports"])


class BulkUpdateReportsIn(BaseModel):
    report_ids: list[int] = Field(default_factory=list, min_length=1, max_length=500)
    status: str


@router.post("/broken-link", response_model=dict)
def report_broken_link(payload: BrokenLinkReportIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = BrokenLinkReport(
        user_id=user.id,
        kind=payload.kind,
        entity_id=payload.entity_id,
        url=payload.url,
        reason=payload.reason,
        status="open",
        created_at=datetime.utcnow(),
    )
    db.add(item)
    db.commit()
    return {"ok": True}


@admin_router.get("", response_model=list[dict])
def list_reports(
    status: str | None = None,
    kind: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    stmt = select(BrokenLinkReport).order_by(desc(BrokenLinkReport.id))
    if status:
        stmt = stmt.where(BrokenLinkReport.status == status)
    if kind:
        stmt = stmt.where(BrokenLinkReport.kind == kind)
    items = db.execute(stmt.offset(max(0, offset)).limit(max(1, min(limit, 200)))).scalars().all()
    return [
        {
            "id": i.id,
            "user_id": i.user_id,
            "kind": i.kind,
            "entity_id": i.entity_id,
            "url": i.url,
            "reason": i.reason,
            "status": i.status,
            "created_at": i.created_at.isoformat(),
        }
        for i in items
    ]


@admin_router.patch("/{report_id}", response_model=dict)
def update_report_status(
    report_id: int,
    status: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    item = db.execute(select(BrokenLinkReport).where(BrokenLinkReport.id == report_id)).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Report not found")
    item.status = status
    db.add(item)
    db.commit()
    return {"ok": True}


@admin_router.patch("/bulk", response_model=dict)
def bulk_update_report_status(
    payload: BulkUpdateReportsIn,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    report_ids = list({rid for rid in payload.report_ids if rid > 0})
    if not report_ids:
        raise HTTPException(status_code=400, detail="report_ids must not be empty")

    items = db.execute(select(BrokenLinkReport).where(BrokenLinkReport.id.in_(report_ids))).scalars().all()
    if not items:
        return {"ok": True, "updated": 0}

    for item in items:
        item.status = payload.status
        db.add(item)
    db.commit()
    return {"ok": True, "updated": len(items)}

