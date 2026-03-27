from pydantic import BaseModel, Field


class AdOut(BaseModel):
    id: int
    placement: str
    html: str
    is_enabled: bool
    sort_order: int


class AdCreateIn(BaseModel):
    placement: str = Field(min_length=1, max_length=60)
    html: str = Field(min_length=1)
    is_enabled: bool = True
    sort_order: int = 0


class AdUpdateIn(BaseModel):
    placement: str | None = None
    html: str | None = None
    is_enabled: bool | None = None
    sort_order: int | None = None

