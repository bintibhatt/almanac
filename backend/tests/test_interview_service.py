"""
Unit tests for InterviewService.
"""

import unittest

from backend.ai.service import AIService
from backend.services.interview_service import InterviewService


class TestInterviewService(unittest.TestCase):

    def setUp(self):
        ai_service = AIService(provider_name="mock")
        self.service = InterviewService(ai_service=ai_service)

    def test_generate_interview_questions(self):
        questions = self.service.generate_interview_questions(
            title="Redis Memory Caching",
            category="backend",
            content="Redis is an in-memory data structure store used as a database, cache, and message broker.",
        )
        self.assertIsInstance(questions, list)
        self.assertGreater(len(questions), 0)

        first = questions[0]
        self.assertIn("level", first)
        self.assertIn("question", first)
        self.assertIn("model_answer", first)


if __name__ == "__main__":
    unittest.main()
