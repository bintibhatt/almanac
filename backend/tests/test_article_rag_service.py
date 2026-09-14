"""
Unit tests for ArticleRAGService.
"""

import unittest

from backend.ai.service import AIService
from backend.services.article_rag_service import ArticleRAGService


class TestArticleRAGService(unittest.TestCase):

    def setUp(self):
        ai_service = AIService(provider_name="mock")
        self.service = ArticleRAGService(ai_service=ai_service)

    def test_answer_question(self):
        answer = self.service.answer_question(
            title="REST API Architecture",
            content="REST APIs use HTTP methods GET, POST, PUT, DELETE for stateless resource operations.",
            question="What HTTP method is used for updating resources?",
        )
        self.assertIsInstance(answer, str)
        self.assertGreater(len(answer), 0)


if __name__ == "__main__":
    unittest.main()
