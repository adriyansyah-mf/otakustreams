from datetime import datetime

from pydantic import BaseModel, Field


class CommentCreateIn(BaseModel):
    kind: str
    entity_id: int
    body: str = Field(min_length=1, max_length=2000)


class CommentOut(BaseModel):
    id: int
    user_id: int
    user_email: str | None = None
    kind: str
    entity_id: int
    body: str
    is_hidden: bool
    created_at: datetime


class RatingUpsertIn(BaseModel):
    kind: str
    entity_id: int
    rating: float = Field(ge=0, le=10)


class RatingOut(BaseModel):
    user_rating: float | None = None
    avg_rating: float | None = None
    total: int = 0


class FollowToggleIn(BaseModel):
    kind: str
    entity_id: int


class NotificationOut(BaseModel):
    id: int
    kind: str
    title_kind: str
    title_id: int
    entity_id: int
    message: str
    is_read: bool
    created_at: datetime


class BrokenLinkReportIn(BaseModel):
    kind: str
    entity_id: int
    url: str
    reason: str = Field(min_length=3, max_length=2000)

