"""
Unit tests for Topic data model and TopicProvider implementations.
"""

import unittest
from backend.providers.base import Topic, slugify
from backend.providers.manual_provider import ManualProvider
from backend.services.topic_service import TopicService


class TestTopicProviders(unittest.TestCase):

    def test_slugify(self):
        self.assertEqual(slugify("Context Engineering - Overview"), "context-engineering---overview")
        self.assertEqual(slugify("How HTTP/2 Works!"), "how-http2-works")
        self.assertEqual(slugify("  Redis Streams  "), "redis-streams")

    def test_topic_model(self):
        topic = Topic(
            title="RAG - Architecture",
            category="ai",
            description="Retrieval Augmented Generation overview.",
            source="manual",
        )
        self.assertEqual(topic.title, "RAG - Architecture")
        self.assertEqual(topic.category, "ai")
        self.assertEqual(topic.slug, "rag---architecture")
        self.assertIn("ai", topic.tags)
        self.assertEqual(topic.to_dict()["title"], "RAG - Architecture")

        # From dict roundtrip
        restored = Topic.from_dict(topic.to_dict())
        self.assertEqual(restored.title, topic.title)
        self.assertEqual(restored.category, topic.category)

    def test_manual_provider(self):
        provider = ManualProvider()
        self.assertEqual(provider.name, "Manual Topic Catalog")
        topics = provider.get_topics()
        self.assertGreater(len(topics), 0)

        first = topics[0]
        self.assertIsInstance(first, Topic)
        self.assertNotEqual(first.title, "")
        self.assertNotEqual(first.category, "")
        self.assertGreater(len(first.tags), 0)

    def test_topic_service(self):
        service = TopicService()
        all_topics = service.get_all_topics()
        self.assertGreater(len(all_topics), 0)

        ai_topics = service.get_topics_by_category("ai")
        self.assertGreater(len(ai_topics), 0)
        self.assertTrue(all(t.category == "ai" for t in ai_topics))

        # Specific topic lookup
        sample = ai_topics[0]
        found = service.get_topic_by_title(sample.title)
        self.assertIsNotNone(found)
        self.assertEqual(found.title, sample.title)

        # Topic selection
        selected = service.select_topic(category="ai")
        self.assertEqual(selected.category, "ai")


if __name__ == "__main__":
    unittest.main()
