from datetime import datetime

from pydantic import BaseModel


class TopItemOut(BaseModel):
    title: str
    count: int


class AdminAnalyticsOverviewOut(BaseModel):
    watch_24h: int
    read_24h: int
    bookmarks: int
    comments_24h: int
    ratings_24h: int
    reports_open: int
    reports_24h: int
    notifications_24h: int
    notifications_unread: int
    most_watched_titles: list[TopItemOut]
    most_read_titles: list[TopItemOut]
    generated_at: datetime

