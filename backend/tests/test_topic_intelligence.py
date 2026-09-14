"""
Unit tests for TopicIntelligenceService.
"""

from pathlib import Path
import tempfile
import unittest

from backend.providers.base import Topic
from backend.services.duplicate_service import DuplicateService
from backend.services.state_service import StateService
from backend.services.topic_intelligence import TopicIntelligenceService
from backend.services.vector_store_service import VectorStoreService


class TestTopicIntelligenceService(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.state_file = Path(self.temp_dir.name) / "state.json"
        self.index_file = Path(self.temp_dir.name) / "vector_index.json"
        self.knowledge_dir = Path(self.temp_dir.name) / "knowledge"
        self.knowledge_dir.mkdir(parents=True, exist_ok=True)

        self.state_service = StateService(state_file_path=self.state_file)
        self.vector_store = VectorStoreService(index_file_path=self.index_file)
        self.duplicate_service = DuplicateService(
            state_service=self.state_service,
            vector_store_service=self.vector_store,
            knowledge_dir=self.knowledge_dir,
        )
        self.intelligence_service = TopicIntelligenceService(duplicate_service=self.duplicate_service)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_evaluate_topic(self):
        topic = Topic(
            title="Distributed Systems Consensus Protocols",
            category="system-design",
            description="Raft and Paxos consensus mechanisms for distributed state machines.",
            source="github",
            difficulty="Advanced",
        )
        ranked = self.intelligence_service.evaluate_topic(topic)
        self.assertFalse(ranked.is_duplicate)
        self.assertGreater(ranked.score, 50.0)

    def test_rank_topics_filters_duplicates(self):
        topic1 = Topic(title="REST API Design", category="backend")
        self.state_service.record_success(topic1, {"provider": "mock", "model": "mock"})

        topic2 = Topic(title="Kafka Event Streaming", category="backend", source="github")

        candidates = [topic1, topic2]
        ranked_list = self.intelligence_service.rank_topics(candidates, filter_duplicates=True)

        self.assertEqual(len(ranked_list), 1)
        self.assertEqual(ranked_list[0].topic.title, "Kafka Event Streaming")


if __name__ == "__main__":
    unittest.main()
