"""history tables

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-26
"""

from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "watch_history",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("episode_id", sa.Integer(), sa.ForeignKey("anime_episodes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("watched_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "episode_id", name="uq_watch_history_user_episode"),
    )
    op.create_index("ix_watch_history_user_id", "watch_history", ["user_id"], unique=False)
    op.create_index("ix_watch_history_episode_id", "watch_history", ["episode_id"], unique=False)

    op.create_table(
        "read_history",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("chapter_id", sa.Integer(), sa.ForeignKey("manga_chapters.id", ondelete="CASCADE"), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "chapter_id", name="uq_read_history_user_chapter"),
    )
    op.create_index("ix_read_history_user_id", "read_history", ["user_id"], unique=False)
    op.create_index("ix_read_history_chapter_id", "read_history", ["chapter_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_read_history_chapter_id", table_name="read_history")
    op.drop_index("ix_read_history_user_id", table_name="read_history")
    op.drop_table("read_history")

    op.drop_index("ix_watch_history_episode_id", table_name="watch_history")
    op.drop_index("ix_watch_history_user_id", table_name="watch_history")
    op.drop_table("watch_history")

