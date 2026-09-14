"""
Unit tests for HybridSearchService.
"""

from pathlib import Path
import tempfile
import unittest

from backend.services.hybrid_search_service import HybridSearchService
from backend.services.vector_store_service import VectorStoreService


class TestHybridSearchService(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.index_file = Path(self.temp_dir.name) / "vector_index.json"
        self.vector_store = VectorStoreService(index_file_path=self.index_file)
        self.hybrid_service = HybridSearchService(vector_store_service=self.vector_store)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_hybrid_search_scoring(self):
        self.vector_store.upsert_article(
            slug="redis-caching",
            title="Redis Memory Caching",
            category="backend",
            content="In-memory cache data structures and TTL policies.",
            metadata={"description": "Redis memory caching overview"},
        )
        self.vector_store.upsert_article(
            slug="docker-containers",
            title="Docker Container Isolation",
            category="devops",
            content="Linux namespaces and cgroups process isolation.",
            metadata={"description": "Docker container process isolation"},
        )

        results = self.hybrid_service.hybrid_search("Redis memory cache", top_k=2)
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0]["slug"], "redis-caching")
        self.assertGreater(results[0]["hybrid_score"], 0.0)


if __name__ == "__main__":
    unittest.main()
