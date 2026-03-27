import os
import unittest

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

from app.routers.notifications import _normalize_feed_params


class NotificationsUtilsTest(unittest.TestCase):
    def test_normalize_feed_params_clamps_values(self):
        limit, offset = _normalize_feed_params(limit=999, offset=-10)
        self.assertEqual(limit, 100)
        self.assertEqual(offset, 0)

    def test_normalize_feed_params_keeps_valid_values(self):
        limit, offset = _normalize_feed_params(limit=25, offset=40)
        self.assertEqual(limit, 25)
        self.assertEqual(offset, 40)


if __name__ == "__main__":
    unittest.main()

