from pydantic import BaseModel, Field


class RegisterIn(BaseModel):
    # MVP: don't over-restrict email format; some envs use `admin@local`.
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class MeOut(BaseModel):
    id: int
    email: str
    role: str

