from pydantic import BaseModel, HttpUrl


class SeoSettingsOut(BaseModel):
    site_title: str
    site_description: str
    og_image_url: str | None


class SeoSettingsUpdateIn(BaseModel):
    site_title: str
    site_description: str
    og_image_url: str | None = None

