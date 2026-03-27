from celery import Celery
from celery.schedules import crontab

from app.core.config import settings


celery_app = Celery(
    "otakustream",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.worker.tasks"],
)

celery_app.conf.timezone = "UTC"

celery_app.conf.beat_schedule = {
    "crawl-enabled-sources-daily-midnight": {
        "task": "crawler.crawl_enabled_sources",
        # Run at 00:00 UTC every day.
        "schedule": crontab(minute=0, hour=0),
    }
}

