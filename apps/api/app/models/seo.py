from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SeoSettings(Base):
    """
    Singleton-ish row (id=1 by convention).
    Admin can update site_title/description/og image.
    """

    __tablename__ = "seo_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    site_title: Mapped[str] = mapped_column(String(200), default="OtakuStream", nullable=False)
    site_description: Mapped[str] = mapped_column(Text, default="Streaming anime & baca manga (MVP).", nullable=False)
    og_image_url: Mapped[str | None] = mapped_column(String(700), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

