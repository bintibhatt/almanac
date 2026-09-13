"""
Unit tests for DuplicateService.
"""

from pathlib import Path
import tempfile
import unittest

from backend.providers.base import Topic
from backend.services.duplicate_service import DuplicateService, normalize_title, token_jaccard_similarity
from backend.services.state_service import StateService


class TestDuplicateService(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.state_file = Path(self.temp_dir.name) / "state.json"
        self.knowledge_dir = Path(self.temp_dir.name) / "knowledge"
        self.knowledge_dir.mkdir(parents=True, exist_ok=True)

        self.state_service = StateService(state_file_path=self.state_file)
        self.duplicate_service = DuplicateService(
            state_service=self.state_service,
            knowledge_dir=self.knowledge_dir,
        )

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_normalize_title(self):
        self.assertEqual(normalize_title("How HTTP Works"), "http works")
        self.assertEqual(normalize_title("Understanding the HTTP Protocol"), "http protocol")

    def test_jaccard_similarity(self):
        sim = token_jaccard_similarity("System Design Principles", "System Design Patterns")
        # Words: {"system", "design", "principles"} vs {"system", "design", "patterns"} => 2/4 = 0.5
        self.assertGreaterEqual(sim, 0.5)

    def test_exact_slug_duplicate(self):
        topic = Topic(title="Docker Containers", category="devops")
        self.state_service.record_success(topic, {"provider": "mock", "model": "mock"})

        dup_result = self.duplicate_service.check_duplicate(topic)
        self.assertTrue(dup_result.is_duplicate)
        self.assertEqual(dup_result.matched_slug, topic.slug)

    def test_non_duplicate(self):
        topic1 = Topic(title="Docker Containers", category="devops")
        self.state_service.record_success(topic1, {"provider": "mock", "model": "mock"})

        topic2 = Topic(title="Kubernetes Orchestration", category="devops")
        dup_result = self.duplicate_service.check_duplicate(topic2)
        self.assertFalse(dup_result.is_duplicate)


if __name__ == "__main__":
    unittest.main()
