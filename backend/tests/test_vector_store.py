"""
Unit tests for VectorStoreService.
"""

from pathlib import Path
import tempfile
import unittest

from backend.services.embedding_service import EmbeddingService
from backend.services.vector_store_service import VectorStoreService


class TestVectorStoreService(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.index_file = Path(self.temp_dir.name) / "vector_index.json"
        self.embedding_service = EmbeddingService(use_local_fallback=True)
        self.vector_store = VectorStoreService(
            index_file_path=self.index_file,
            embedding_service=self.embedding_service,
        )

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_upsert_and_search(self):
        self.vector_store.upsert_article(
            slug="rest-api-design",
            title="REST API Design Guidelines",
            category="backend",
            content="Comprehensive guide to REST API endpoints, HTTP verbs, status codes, and JSON response bodies.",
            metadata={"tags": ["api", "rest", "backend"]},
        )

        self.vector_store.upsert_article(
            slug="docker-containers",
            title="Docker Containers and Cgroups",
            category="devops",
            content="Linux namespaces and cgroups isolation for lightweight containerization.",
            metadata={"tags": ["docker", "devops"]},
        )

        self.assertEqual(self.vector_store.get_index_size(), 2)

        # Search query matching REST API
        results = self.vector_store.search_similar("REST API status codes", top_k=2)
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0]["slug"], "rest-api-design")

    def test_related_articles(self):
        self.vector_store.upsert_article(
            slug="article-a",
            title="Caching Strategies with Redis",
            category="backend",
            content="Redis in-memory caching patterns and TTL policies.",
        )
        self.vector_store.upsert_article(
            slug="article-b",
            title="Advanced In-Memory Caching",
            category="backend",
            content="LRU cache eviction policies and memory optimization.",
        )
        self.vector_store.upsert_article(
            slug="article-c",
            title="Quantum Physics Overview",
            category="physics",
            content="Subatomic particles, wave function collapse, and superposition.",
        )

        related = self.vector_store.get_related_articles("article-a", top_k=2)
        self.assertEqual(len(related), 2)
        self.assertEqual(related[0]["slug"], "article-b")


if __name__ == "__main__":
    unittest.main()
