from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.source import Source, SourceKind


DEFAULT_SOURCES: list[dict] = [
    {
        "kind": SourceKind.anime.value,
        "name": "Otakudesu (list)",
        # Domain often changes; this matches the user's working scraper.
        "base_url": "https://otakudesu.cloud",
        "list_url": "https://otakudesu.cloud/anime-list/",
        "crawl_interval_minutes": 1440,
        "config_json": "{}",
    },
    {
        "kind": SourceKind.manga.value,
        "name": "Komiku (list)",
        "base_url": "https://komiku.org",
        "list_url": "https://komiku.org/daftar-komik/",
        "crawl_interval_minutes": 1440,
        "config_json": "{}",
    },
]


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.execute(select(Source).limit(1)).scalar_one_or_none()
        if existing:
            return

        for s in DEFAULT_SOURCES:
            db.add(Source(**s))
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()

