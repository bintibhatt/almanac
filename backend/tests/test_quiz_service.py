"""
Unit tests for QuizService.
"""

import unittest

from backend.ai.service import AIService
from backend.services.quiz_service import QuizService


class TestQuizService(unittest.TestCase):

    def setUp(self):
        ai_service = AIService(provider_name="mock")
        self.service = QuizService(ai_service=ai_service)

    def test_generate_quiz(self):
        questions = self.service.generate_quiz(
            title="REST API Architecture",
            category="backend",
            content="REST APIs use HTTP methods like GET, POST, PUT, DELETE for CRUD operations.",
        )
        self.assertIsInstance(questions, list)
        self.assertGreater(len(questions), 0)

        first = questions[0]
        self.assertIn("question", first)
        self.assertIn("options", first)
        self.assertIn("correct_index", first)


if __name__ == "__main__":
    unittest.main()
