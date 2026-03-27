from pydantic import BaseModel


class BookmarkToggleIn(BaseModel):
    kind: str
    entity_id: int


class BookmarkOut(BaseModel):
    id: int
    kind: str
    entity_id: int
