"""public feature tables

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-26
"""

from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS content_comments (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            kind VARCHAR(20) NOT NULL,
            entity_id INTEGER NOT NULL,
            body TEXT NOT NULL,
            is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_content_comments_user_id ON content_comments(user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_content_comments_kind ON content_comments(kind);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_content_comments_entity_id ON content_comments(entity_id);")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS content_ratings (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            kind VARCHAR(20) NOT NULL,
            entity_id INTEGER NOT NULL,
            rating DOUBLE PRECISION NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_content_ratings_user_kind_entity UNIQUE (user_id, kind, entity_id)
        );
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_content_ratings_user_id ON content_ratings(user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_content_ratings_kind ON content_ratings(kind);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_content_ratings_entity_id ON content_ratings(entity_id);")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS title_follows (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            kind VARCHAR(20) NOT NULL,
            entity_id INTEGER NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_title_follows_user_kind_entity UNIQUE (user_id, kind, entity_id)
        );
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_title_follows_user_id ON title_follows(user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_title_follows_kind ON title_follows(kind);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_title_follows_entity_id ON title_follows(entity_id);")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS notification_events (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            kind VARCHAR(30) NOT NULL,
            title_kind VARCHAR(20) NOT NULL,
            title_id INTEGER NOT NULL,
            entity_id INTEGER NOT NULL,
            message VARCHAR(400) NOT NULL,
            is_read BOOLEAN NOT NULL DEFAULT FALSE,
            meta JSONB NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_notification_events_user_id ON notification_events(user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notification_events_kind ON notification_events(kind);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notification_events_title_kind ON notification_events(title_kind);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notification_events_title_id ON notification_events(title_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notification_events_entity_id ON notification_events(entity_id);")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS watch_progress (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            episode_id INTEGER NOT NULL REFERENCES anime_episodes(id) ON DELETE CASCADE,
            last_second INTEGER NOT NULL DEFAULT 0,
            duration INTEGER NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_watch_progress_user_episode UNIQUE (user_id, episode_id)
        );
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_watch_progress_user_id ON watch_progress(user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_watch_progress_episode_id ON watch_progress(episode_id);")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS broken_link_reports (
            id INTEGER PRIMARY KEY,
            user_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
            kind VARCHAR(20) NOT NULL,
            entity_id INTEGER NOT NULL,
            url VARCHAR(700) NOT NULL,
            reason TEXT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'open',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_broken_link_reports_user_id ON broken_link_reports(user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_broken_link_reports_kind ON broken_link_reports(kind);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_broken_link_reports_entity_id ON broken_link_reports(entity_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_broken_link_reports_status ON broken_link_reports(status);")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS broken_link_reports;")
    op.execute("DROP TABLE IF EXISTS watch_progress;")
    op.execute("DROP TABLE IF EXISTS notification_events;")
    op.execute("DROP TABLE IF EXISTS title_follows;")
    op.execute("DROP TABLE IF EXISTS content_ratings;")
    op.execute("DROP TABLE IF EXISTS content_comments;")

