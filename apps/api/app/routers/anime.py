from fastapi import APIRouter, Depends, Query
from sqlalchemy import Float, cast, desc, func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.anime import AnimeEpisode, AnimeTitle
from app.schemas.anime import AnimeDetailOut, AnimeEpisodeOut, AnimeListItem

router = APIRouter(prefix="/anime", tags=["anime"])


@router.get("", response_model=list[AnimeListItem])
def list_anime(
    q: str | None = Query(default=None),
    genre: str | None = Query(default=None),
    status: str | None = Query(default=None),
    min_score: float | None = Query(default=None, ge=0, le=10),
    sort: str = Query(default="latest"),
    limit: int = Query(default=40, ge=1),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    stmt = select(AnimeTitle)
    if q:
        stmt = stmt.where(AnimeTitle.title.ilike(f"%{q}%"))
    if genre:
        stmt = stmt.where(AnimeTitle.genres.contains([genre]))
    if status:
        stmt = stmt.where(AnimeTitle.status.ilike(f"%{status}%"))
    if min_score is not None:
        numeric_score = cast(func.nullif(func.regexp_replace(AnimeTitle.score, r"[^0-9.]", "", "g"), ""), Float)
        stmt = stmt.where(numeric_score >= min_score)

    if sort == "title_asc":
        stmt = stmt.order_by(AnimeTitle.title.asc())
    elif sort == "score_desc":
        numeric_score = cast(func.nullif(func.regexp_replace(AnimeTitle.score, r"[^0-9.]", "", "g"), ""), Float)
        stmt = stmt.order_by(numeric_score.desc().nullslast())
    else:
        stmt = stmt.order_by(desc(AnimeTitle.updated_at))

    stmt = stmt.offset(offset).limit(limit)
    items = db.execute(stmt).scalars().all()
    return [AnimeListItem(id=a.id, title=a.title, score=a.score, thumbnail_url=a.thumbnail_url) for a in items]


@router.get("/{anime_id}", response_model=AnimeDetailOut)
def get_anime(anime_id: int, db: Session = Depends(get_db)):
    anime = db.execute(select(AnimeTitle).where(AnimeTitle.id == anime_id)).scalar_one()
    eps = db.execute(
        select(AnimeEpisode).where(AnimeEpisode.anime_id == anime.id).order_by(desc(AnimeEpisode.episode_number))
    ).scalars().all()
    return AnimeDetailOut(
        id=anime.id,
        title=anime.title,
        alt_title=anime.alt_title,
        status=anime.status,
        score=anime.score,
        synopsis=anime.synopsis,
        thumbnail_url=anime.thumbnail_url,
        genres=anime.genres,
        source_url=anime.source_url,
        episodes=[
            AnimeEpisodeOut(
                id=e.id,
                episode_number=e.episode_number,
                title=e.title,
                source_url=e.source_url,
                video_links=e.video_links,
                created_at=e.created_at,
            )
            for e in eps
        ],
    )

