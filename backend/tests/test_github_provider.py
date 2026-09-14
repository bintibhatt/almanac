"""
Unit tests for GitHubProvider.
"""

import unittest

from backend.providers.github_provider import GitHubProvider


class TestGitHubProvider(unittest.TestCase):

    def setUp(self):
        self.provider = GitHubProvider(timeout=1)

    def test_provider_name(self):
        self.assertEqual(self.provider.name, "GitHub Trending")

    def test_get_topics_returns_valid_topics(self):
        topics = self.provider.get_topics()
        self.assertIsInstance(topics, list)
        self.assertGreater(len(topics), 0)

        first = topics[0]
        self.assertTrue(first.title)
        self.assertEqual(first.source, "github")


if __name__ == "__main__":
    unittest.main()
