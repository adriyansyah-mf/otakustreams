"""seo settings and ads tables

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-26
"""

from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS seo_settings (
            id INTEGER PRIMARY KEY,
            site_title VARCHAR(200) NOT NULL DEFAULT 'OtakuStream',
            site_description TEXT NOT NULL DEFAULT 'Streaming anime & baca manga (MVP).',
            og_image_url VARCHAR(700) NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS ads (
            id INTEGER PRIMARY KEY,
            placement VARCHAR(60) NOT NULL,
            html TEXT NOT NULL,
            is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_ads_placement ON ads(placement);")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS ads;")
    op.execute("DROP TABLE IF EXISTS seo_settings;")

