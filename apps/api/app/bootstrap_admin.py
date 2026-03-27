from passlib.hash import argon2
from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.user import User, UserRole


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.execute(select(User).where(User.email == settings.admin_email)).scalar_one_or_none()
        if existing:
            return
        user = User(
            email=settings.admin_email,
            password_hash=argon2.hash(settings.admin_password),
            role=UserRole.admin.value,
            is_active=True,
        )
        db.add(user)
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()

