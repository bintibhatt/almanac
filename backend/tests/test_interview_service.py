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

    def test_generate_interview_plan_custom_count(self):
        plan = self.service.generate_interview_plan(
            role="Distributed Systems Engineer",
            experience_level="Senior (5-8 yrs)",
            focus="Consensus & Raft",
            question_count=4,
        )
        self.assertIsInstance(plan, dict)
        self.assertEqual(plan["role"], "Distributed Systems Engineer")
        self.assertIn("questions", plan)
        self.assertEqual(len(plan["questions"]), 4)

    def test_generate_interview_plan_higher_count(self):
        plan = self.service.generate_interview_plan(
            role="Applied AI Engineer",
            experience_level="Senior (5-8 yrs)",
            focus="RAG & vLLM",
            question_count=7,
        )
        self.assertIsInstance(plan, dict)
        self.assertEqual(len(plan["questions"]), 7)

    def test_generate_interview_plan_fifteen_questions(self):
        plan = self.service.generate_interview_plan(
            role="Staff Backend Engineer",
            experience_level="Staff / Principal (8+ yrs)",
            focus="Distributed Systems, CRDTs, Raft",
            question_count=15,
        )
        self.assertIsInstance(plan, dict)
        self.assertEqual(len(plan["questions"]), 15)
        # Check all 15 question IDs are unique and numbered 1..15
        ids = [q["id"] for q in plan["questions"]]
        self.assertEqual(len(set(ids)), 15)
        self.assertEqual(ids, [f"q-{i}" for i in range(1, 16)])

    def test_evaluate_answer(self):
        result = self.service.evaluate_answer(
            question="How does MVCC work in PostgreSQL?",
            model_answer="MVCC uses row versions with xmin and xmax.",
            user_answer="PostgreSQL writes new row tuples with xmin and xmax rather than locking.",
            role="Backend Engineer",
            difficulty="Medium",
        )
        self.assertIsInstance(result, dict)
        self.assertIn("score", result)
        self.assertIn("rating", result)
        self.assertIn("strengths", result)
        self.assertIn("gaps", result)


if __name__ == "__main__":
    unittest.main()
