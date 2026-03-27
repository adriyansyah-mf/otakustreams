from __future__ import annotations

from datetime import datetime, timedelta
from urllib.parse import urlparse

from sqlalchemy import select

from app.crawler.adapters import komiku, otakudesu
from app.crawler.flexible import anime as flex_anime
from app.crawler.flexible import manga as flex_manga
from app.db.session import SessionLocal
from app.models.crawl import CrawlJob, CrawlLog
from app.models.source import Source, SourceKind
from app.services.content_upsert import (
    upsert_anime_episode,
    upsert_anime_title,
    upsert_manga_chapter,
    upsert_manga_title,
)
from app.worker.celery_app import celery_app


@celery_app.task(name="noop")
def noop() -> dict:
    return {"ok": True}


@celery_app.task(name="crawler.crawl_enabled_sources")
def crawl_enabled_sources() -> dict:
    db = SessionLocal()
    try:
        sources = db.execute(select(Source).where(Source.is_enabled == True)).scalars().all()  # noqa: E712
        now = datetime.utcnow()
        ran = 0
        skipped = 0
        for s in sources:
            if s.last_crawled_at and now - s.last_crawled_at < timedelta(minutes=s.crawl_interval_minutes):
                skipped += 1
                continue
            crawl_source.delay(s.id)
            ran += 1
        return {"queued": ran, "skipped": skipped}
    finally:
        db.close()


@celery_app.task(name="crawler.crawl_source")
def crawl_source(source_id: int) -> dict:
    db = SessionLocal()
    job = CrawlJob(source_id=source_id, status="running", started_at=datetime.utcnow(), created_at=datetime.utcnow())
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        source = db.execute(select(Source).where(Source.id == source_id)).scalar_one()
        base_url = source.base_url.rstrip("/")

        if source.kind == SourceKind.anime.value:
            cfg = flex_anime.load_config(source.config_json)
            if cfg.get("mode") == "flexible":
                detail_urls = flex_anime.crawl_anime_list(source.list_url, base_url, cfg)
            else:
                detail_urls = _crawl_anime_list(source.list_url, base_url)
            stats = {"titles": 0, "episodes": 0}
            for u in detail_urls:
                stats["titles"] += 1
                _crawl_one_anime(db, source_id=source.id, base_url=base_url, detail_url=u, stats=stats)

        else:
            cfg = flex_manga.load_config(source.config_json)
            if cfg.get("mode") == "flexible":
                detail_urls = flex_manga.crawl_manga_list(source.list_url, base_url, cfg)
            else:
                detail_urls = komiku.crawl_list(source.list_url, base_url)
            stats = {"titles": 0, "chapters": 0}
            for u in detail_urls:
                stats["titles"] += 1
                _crawl_one_manga(db, source_id=source.id, base_url=base_url, detail_url=u, stats=stats)

        source.last_crawled_at = datetime.utcnow()
        db.add(source)
        db.commit()

        job.status = "success"
        job.finished_at = datetime.utcnow()
        job.stats = stats
        db.add(job)
        db.commit()
        return {"ok": True, "stats": stats}

    except Exception as e:
        db.add(CrawlLog(source_id=source_id, level="error", message=str(e), meta={"job_id": job.id}, created_at=datetime.utcnow()))
        db.commit()
        job.status = "failed"
        job.finished_at = datetime.utcnow()
        job.error = str(e)
        db.add(job)
        db.commit()
        raise
    finally:
        db.close()


def _crawl_anime_list(list_url: str, base_url: str) -> list[str]:
    return otakudesu.crawl_list(list_url, base_url)


def _crawl_one_anime(db, *, source_id: int, base_url: str, detail_url: str, stats: dict) -> None:
    source = db.execute(select(Source).where(Source.id == source_id)).scalar_one()
    cfg = flex_anime.load_config(source.config_json)

    if cfg.get("mode") == "flexible":
        detail = flex_anime.crawl_anime_detail(detail_url, base_url, cfg)
        anime = upsert_anime_title(
            db,
            source_id=source_id,
            source_slug=detail.slug,
            source_url=detail.url,
            title=detail.title,
            thumbnail_url=detail.thumbnail_url,
            synopsis=detail.synopsis,
            score=detail.score,
            status=detail.status,
            genres=detail.genres,
        )
        for ep_url in detail.episode_urls:
            ep = flex_anime.crawl_episode_detail(ep_url, base_url, cfg)
            if not ep.episode_number:
                continue
            upsert_anime_episode(
                db,
                anime_id=anime.id,
                episode_number=ep.episode_number,
                source_url=ep.url,
                title=ep.title,
                video_links=ep.video_links,
            )
            stats["episodes"] += 1
        return

    detail = otakudesu.crawl_anime_detail(detail_url, base_url)
    anime = upsert_anime_title(
        db,
        source_id=source_id,
        source_slug=detail.slug,
        source_url=detail.url,
        title=detail.title,
        thumbnail_url=detail.thumbnail_url,
        synopsis=detail.synopsis,
        score=detail.score,
        status=detail.status,
        genres=detail.genres,
    )
    for ep_url in detail.episode_urls:
        ep = otakudesu.crawl_episode_detail(ep_url, base_url)
        if not ep.episode_number:
            continue
        upsert_anime_episode(
            db,
            anime_id=anime.id,
            episode_number=ep.episode_number,
            source_url=ep.url,
            title=ep.title,
            video_links=ep.video_links,
        )
        stats["episodes"] += 1


def _crawl_one_manga(db, *, source_id: int, base_url: str, detail_url: str, stats: dict) -> None:
    source = db.execute(select(Source).where(Source.id == source_id)).scalar_one()
    cfg = flex_manga.load_config(source.config_json)

    if cfg.get("mode") == "flexible":
        detail = flex_manga.crawl_manga_detail(detail_url, base_url, cfg)
        manga = upsert_manga_title(
            db,
            source_id=source_id,
            source_slug=detail.slug,
            source_url=detail.url,
            title=detail.title,
            thumbnail_url=detail.thumbnail_url,
            synopsis=detail.synopsis,
            status=detail.status,
            genres=detail.genres,
        )
        for ch_url in detail.chapter_urls:
            ch = flex_manga.crawl_chapter_detail(ch_url, base_url, cfg)
            if not ch.chapter_number:
                continue
            upsert_manga_chapter(
                db,
                manga_id=manga.id,
                chapter_number=ch.chapter_number,
                source_url=ch.url,
                title=ch.title,
                page_images=ch.page_images,
            )
            stats["chapters"] += 1
        return

    detail = komiku.crawl_manga_detail(detail_url, base_url)
    manga = upsert_manga_title(
        db,
        source_id=source_id,
        source_slug=detail.slug,
        source_url=detail.url,
        title=detail.title,
        thumbnail_url=detail.thumbnail_url,
        synopsis=detail.synopsis,
        status=detail.status,
        genres=detail.genres,
    )
    for ch_url in detail.chapter_urls:
        ch = komiku.crawl_chapter_detail(ch_url, base_url)
        if not ch.chapter_number:
            continue
        upsert_manga_chapter(
            db,
            manga_id=manga.id,
            chapter_number=ch.chapter_number,
            source_url=ch.url,
            title=ch.title,
            page_images=ch.page_images,
        )
        stats["chapters"] += 1

