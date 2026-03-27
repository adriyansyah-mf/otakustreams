from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.manga import MangaChapter, MangaTitle
from app.schemas.manga import MangaChapterListItem, MangaChapterOut, MangaDetailOut, MangaListItem

router = APIRouter(prefix="/manga", tags=["manga"])


@router.get("", response_model=list[MangaListItem])
def list_manga(
    q: str | None = Query(default=None),
    genre: str | None = Query(default=None),
    status: str | None = Query(default=None),
    sort: str = Query(default="latest"),
    limit: int = Query(default=40, ge=1),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    stmt = select(MangaTitle)
    if q:
        stmt = stmt.where(MangaTitle.title.ilike(f"%{q}%"))
    if genre:
        stmt = stmt.where(MangaTitle.genres.contains([genre]))
    if status:
        stmt = stmt.where(MangaTitle.status.ilike(f"%{status}%"))
    if sort == "title_asc":
        stmt = stmt.order_by(MangaTitle.title.asc())
    else:
        stmt = stmt.order_by(desc(MangaTitle.updated_at))
    stmt = stmt.offset(offset).limit(limit)
    items = db.execute(stmt).scalars().all()
    return [MangaListItem(id=m.id, title=m.title, thumbnail_url=m.thumbnail_url) for m in items]


@router.get("/{manga_id}", response_model=MangaDetailOut)
def get_manga(manga_id: int, db: Session = Depends(get_db)):
    manga = db.execute(select(MangaTitle).where(MangaTitle.id == manga_id)).scalar_one()
    chs = db.execute(
        select(MangaChapter).where(MangaChapter.manga_id == manga.id).order_by(desc(MangaChapter.chapter_number))
    ).scalars().all()
    return MangaDetailOut(
        id=manga.id,
        title=manga.title,
        status=manga.status,
        synopsis=manga.synopsis,
        thumbnail_url=manga.thumbnail_url,
        genres=manga.genres,
        source_url=manga.source_url,
        chapters=[
            MangaChapterOut(
                id=c.id,
                chapter_number=c.chapter_number,
                title=c.title,
                source_url=c.source_url,
                page_images=c.page_images,
                created_at=c.created_at,
            )
            for c in chs
        ],
    )


@router.get("/chapters/{chapter_id}", response_model=MangaChapterOut)
def get_chapter(chapter_id: int, db: Session = Depends(get_db)):
    ch = db.execute(select(MangaChapter).where(MangaChapter.id == chapter_id)).scalar_one()
    return MangaChapterOut(
        id=ch.id,
        chapter_number=ch.chapter_number,
        title=ch.title,
        source_url=ch.source_url,
        page_images=ch.page_images,
        created_at=ch.created_at,
    )


@router.get("/chapters", response_model=list[MangaChapterListItem])
def list_chapters(
    limit: int = Query(default=100, ge=1),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    items = (
        db.execute(
            select(MangaChapter)
            .order_by(desc(MangaChapter.id))
            .offset(offset)
            .limit(limit)
        )
        .scalars()
        .all()
    )
    return [
        MangaChapterListItem(
            id=c.id,
            manga_id=c.manga_id,
            chapter_number=c.chapter_number,
            title=c.title,
            created_at=c.created_at,
        )
        for c in items
    ]

