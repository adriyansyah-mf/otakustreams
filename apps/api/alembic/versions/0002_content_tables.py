"""content tables

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-26
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sources",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("kind", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("base_url", sa.String(length=500), nullable=False),
        sa.Column("list_url", sa.String(length=500), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("crawl_interval_minutes", sa.Integer(), nullable=False, server_default="360"),
        sa.Column("config_json", sa.Text(), nullable=False, server_default="{}"),
        sa.Column("last_crawled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_sources_kind", "sources", ["kind"], unique=False)

    op.create_table(
        "anime_titles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_id", sa.Integer(), sa.ForeignKey("sources.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_slug", sa.String(length=255), nullable=False),
        sa.Column("source_url", sa.String(length=700), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("alt_title", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=80), nullable=True),
        sa.Column("score", sa.String(length=40), nullable=True),
        sa.Column("synopsis", sa.Text(), nullable=True),
        sa.Column("thumbnail_url", sa.String(length=700), nullable=True),
        sa.Column("genres", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("extra", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("source_id", "source_slug", name="uq_anime_titles_source_slug"),
    )
    op.create_index("ix_anime_titles_source_id", "anime_titles", ["source_id"], unique=False)

    op.create_table(
        "anime_episodes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("anime_id", sa.Integer(), sa.ForeignKey("anime_titles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("episode_number", sa.Float(), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=True),
        sa.Column("source_url", sa.String(length=700), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("video_links", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("anime_id", "episode_number", name="uq_anime_episode_number"),
    )
    op.create_index("ix_anime_episodes_anime_id", "anime_episodes", ["anime_id"], unique=False)

    op.create_table(
        "manga_titles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_id", sa.Integer(), sa.ForeignKey("sources.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_slug", sa.String(length=255), nullable=False),
        sa.Column("source_url", sa.String(length=700), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("synopsis", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=80), nullable=True),
        sa.Column("thumbnail_url", sa.String(length=700), nullable=True),
        sa.Column("genres", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("extra", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("source_id", "source_slug", name="uq_manga_titles_source_slug"),
    )
    op.create_index("ix_manga_titles_source_id", "manga_titles", ["source_id"], unique=False)

    op.create_table(
        "manga_chapters",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("manga_id", sa.Integer(), sa.ForeignKey("manga_titles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("chapter_number", sa.Float(), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=True),
        sa.Column("source_url", sa.String(length=700), nullable=False),
        sa.Column("page_images", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("manga_id", "chapter_number", name="uq_manga_chapter_number"),
    )
    op.create_index("ix_manga_chapters_manga_id", "manga_chapters", ["manga_id"], unique=False)

    op.create_table(
        "bookmarks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(length=30), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "kind", "entity_id", name="uq_bookmarks_user_kind_entity"),
    )
    op.create_index("ix_bookmarks_user_id", "bookmarks", ["user_id"], unique=False)
    op.create_index("ix_bookmarks_kind", "bookmarks", ["kind"], unique=False)
    op.create_index("ix_bookmarks_entity_id", "bookmarks", ["entity_id"], unique=False)

    op.create_table(
        "analytics_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_name", sa.String(length=60), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("entity_kind", sa.String(length=30), nullable=True),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("meta", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_analytics_events_event_name", "analytics_events", ["event_name"], unique=False)
    op.create_index("ix_analytics_events_user_id", "analytics_events", ["user_id"], unique=False)
    op.create_index("ix_analytics_events_entity_kind", "analytics_events", ["entity_kind"], unique=False)
    op.create_index("ix_analytics_events_entity_id", "analytics_events", ["entity_id"], unique=False)

    op.create_table(
        "crawl_jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_id", sa.Integer(), sa.ForeignKey("sources.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("stats", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_crawl_jobs_source_id", "crawl_jobs", ["source_id"], unique=False)
    op.create_index("ix_crawl_jobs_status", "crawl_jobs", ["status"], unique=False)

    op.create_table(
        "crawl_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("source_id", sa.Integer(), sa.ForeignKey("sources.id", ondelete="CASCADE"), nullable=False),
        sa.Column("level", sa.String(length=10), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("meta", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_crawl_logs_source_id", "crawl_logs", ["source_id"], unique=False)
    op.create_index("ix_crawl_logs_level", "crawl_logs", ["level"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_crawl_logs_level", table_name="crawl_logs")
    op.drop_index("ix_crawl_logs_source_id", table_name="crawl_logs")
    op.drop_table("crawl_logs")

    op.drop_index("ix_crawl_jobs_status", table_name="crawl_jobs")
    op.drop_index("ix_crawl_jobs_source_id", table_name="crawl_jobs")
    op.drop_table("crawl_jobs")

    op.drop_index("ix_analytics_events_entity_id", table_name="analytics_events")
    op.drop_index("ix_analytics_events_entity_kind", table_name="analytics_events")
    op.drop_index("ix_analytics_events_user_id", table_name="analytics_events")
    op.drop_index("ix_analytics_events_event_name", table_name="analytics_events")
    op.drop_table("analytics_events")

    op.drop_index("ix_bookmarks_entity_id", table_name="bookmarks")
    op.drop_index("ix_bookmarks_kind", table_name="bookmarks")
    op.drop_index("ix_bookmarks_user_id", table_name="bookmarks")
    op.drop_table("bookmarks")

    op.drop_index("ix_manga_chapters_manga_id", table_name="manga_chapters")
    op.drop_table("manga_chapters")

    op.drop_index("ix_manga_titles_source_id", table_name="manga_titles")
    op.drop_table("manga_titles")

    op.drop_index("ix_anime_episodes_anime_id", table_name="anime_episodes")
    op.drop_table("anime_episodes")

    op.drop_index("ix_anime_titles_source_id", table_name="anime_titles")
    op.drop_table("anime_titles")

    op.drop_index("ix_sources_kind", table_name="sources")
    op.drop_table("sources")

    # Enum type (if any) is left untouched intentionally.

