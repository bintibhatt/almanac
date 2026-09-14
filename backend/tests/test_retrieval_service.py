"""
Unit tests for RetrievalService.
"""

from pathlib import Path
import tempfile
import unittest

from backend.providers.base import Topic
from backend.services.hybrid_search_service import HybridSearchService
from backend.services.retrieval_service import RetrievalService
from backend.services.vector_store_service import VectorStoreService


class TestRetrievalService(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.index_file = Path(self.temp_dir.name) / "vector_index.json"
        self.vector_store = VectorStoreService(index_file_path=self.index_file)
        self.hybrid_service = HybridSearchService(vector_store_service=self.vector_store)
        self.retrieval_service = RetrievalService(hybrid_search_service=self.hybrid_service)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_retrieve_context(self):
        self.vector_store.upsert_article(
            slug="existing-topic",
            title="REST API Architecture",
            category="backend",
            content="HTTP verbs, status codes, and JSON response bodies.",
            metadata={"description": "REST API Architecture reference"},
        )

        topic = Topic(title="API Gateway Architecture", category="backend")
        context = self.retrieval_service.retrieve_context(topic)

        self.assertIsInstance(context, str)


if __name__ == "__main__":
    unittest.main()
