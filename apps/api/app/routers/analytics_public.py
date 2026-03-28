from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.pageview import PageView
from app.schemas.analytics_track import PageViewTrackIn

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/track")
def track_page_view(payload: PageViewTrackIn, db: Session = Depends(get_db)):
    path = payload.path.strip()[:500]
    if not path.startswith("/"):
        path = "/" + path
    db.add(PageView(path=path, session_id=payload.session_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
