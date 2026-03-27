import os
import unittest
from datetime import datetime, timedelta

# Ensure settings can initialize when importing app modules in tests.
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

from fastapi import HTTPException

from app.routers.community import _is_comment_rate_limited, _sanitize_comment_body


class CommunityUtilsTest(unittest.TestCase):
    def test_sanitize_comment_escapes_html(self):
        body = _sanitize_comment_body(" <script>alert(1)</script> ok ")
        self.assertIn("&lt;script&gt;", body)
        self.assertIn("ok", body)

    def test_sanitize_comment_rejects_blocked_word(self):
        with self.assertRaises(HTTPException) as ctx:
            _sanitize_comment_body("ini anjing banget")
        self.assertEqual(ctx.exception.status_code, 400)

    def test_sanitize_comment_rejects_too_many_links(self):
        with self.assertRaises(HTTPException) as ctx:
            _sanitize_comment_body("a https://a.com b https://b.com c https://c.com")
        self.assertEqual(ctx.exception.status_code, 400)

    def test_rate_limit_true_when_under_window(self):
        now = datetime.utcnow()
        self.assertTrue(_is_comment_rate_limited(now - timedelta(seconds=5), now, window_seconds=15))

    def test_rate_limit_false_when_over_window(self):
        now = datetime.utcnow()
        self.assertFalse(_is_comment_rate_limited(now - timedelta(seconds=30), now, window_seconds=15))


if __name__ == "__main__":
    unittest.main()

