"""
Unit tests for FlashcardService.
"""

import unittest

from backend.ai.service import AIService
from backend.services.flashcard_service import FlashcardService


class TestFlashcardService(unittest.TestCase):

    def setUp(self):
        ai_service = AIService(provider_name="mock")
        self.service = FlashcardService(ai_service=ai_service)

    def test_generate_flashcards(self):
        cards = self.service.generate_flashcards(
            title="Docker Container Isolation",
            category="devops",
            content="Linux namespaces isolate processes while cgroups restrict CPU and memory resource usage.",
        )
        self.assertIsInstance(cards, list)
        self.assertGreater(len(cards), 0)

        first = cards[0]
        self.assertIn("concept", first)
        self.assertIn("question", first)
        self.assertIn("answer", first)


if __name__ == "__main__":
    unittest.main()
