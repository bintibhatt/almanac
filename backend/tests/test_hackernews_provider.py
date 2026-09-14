"""
Unit tests for HackerNewsProvider.
"""

import unittest

from backend.providers.hackernews_provider import HackerNewsProvider


class TestHackerNewsProvider(unittest.TestCase):

    def setUp(self):
        self.provider = HackerNewsProvider(limit=3, timeout=1)

    def test_provider_name(self):
        self.assertEqual(self.provider.name, "Hacker News")

    def test_get_topics_returns_valid_topics(self):
        topics = self.provider.get_topics()
        self.assertIsInstance(topics, list)
        self.assertGreater(len(topics), 0)

        first = topics[0]
        self.assertTrue(first.title)
        self.assertEqual(first.source, "hackernews")


if __name__ == "__main__":
    unittest.main()
