"""
Unit tests for StateService.
"""

import json
from pathlib import Path
import tempfile
import unittest

from backend.providers.base import Topic
from backend.services.state_service import StateService


class TestStateService(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.state_file = Path(self.temp_dir.name) / "state.json"
        self.state_service = StateService(state_file_path=self.state_file)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_initial_state(self):
        summary = self.state_service.get_summary()
        self.assertEqual(summary["total_generated"], 0)
        self.assertEqual(summary["total_skipped"], 0)
        self.assertEqual(summary["total_failed"], 0)

    def test_record_success(self):
        topic = Topic(title="Test State Topic", category="backend")
        metadata = {
            "provider": "mock",
            "model": "mock-v1",
            "generatedAt": "2026-09-12T00:00:00Z",
        }
        self.state_service.record_success(topic, metadata)

        self.assertTrue(self.state_service.is_topic_generated(topic.slug))
        summary = self.state_service.get_summary()
        self.assertEqual(summary["total_generated"], 1)
        self.assertEqual(summary["last_execution"]["status"], "success")

    def test_record_skip_and_failure(self):
        topic = Topic(title="Skipped Topic", category="ai")
        self.state_service.record_skip(topic, reason="Duplicate test")

        summary = self.state_service.get_summary()
        self.assertEqual(summary["total_skipped"], 1)
        self.assertEqual(summary["last_execution"]["status"], "skipped")

        failed_topic = Topic(title="Failed Topic", category="security")
        self.state_service.record_failure(failed_topic, error="Validation error")

        summary = self.state_service.get_summary()
        self.assertEqual(summary["total_failed"], 1)
        self.assertEqual(summary["last_execution"]["status"], "failed")


if __name__ == "__main__":
    unittest.main()
