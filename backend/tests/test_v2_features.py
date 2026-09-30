"""
Unit tests for Almanac v2 features:
- Topic selection logic (deterministic, no random.choice)
- Manual note generation and duplicate detection flow
- Course curriculum structure and fallback generation
- Interview role analysis, plan generation, and answer evaluation
- Web Push notification service
"""

from pathlib import Path
import tempfile
import unittest

from backend.providers.base import Topic
from backend.providers.knowledge_gap_provider import KnowledgeGapProvider
from backend.providers.user_request_provider import UserRequestProvider
from backend.services.course_service import CourseService
from backend.services.duplicate_service import DuplicateService
from backend.services.interview_service import InterviewService
from backend.services.notification_service import NotificationService
from backend.services.state_service import StateService
from backend.services.topic_intelligence import TopicIntelligenceService
from backend.services.vector_store_service import VectorStoreService


class TestAlmanacV2Features(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.state_file = Path(self.temp_dir.name) / "state.json"
        self.index_file = Path(self.temp_dir.name) / "vector_index.json"
        self.req_file = Path(self.temp_dir.name) / "requested_topics.json"
        self.push_file = Path(self.temp_dir.name) / "push_subscriptions.json"
        self.knowledge_dir = Path(self.temp_dir.name) / "knowledge"
        self.knowledge_dir.mkdir(parents=True, exist_ok=True)

        self.state_service = StateService(state_file_path=self.state_file)
        self.vector_store = VectorStoreService(index_file_path=self.index_file)
        self.duplicate_service = DuplicateService(
            state_service=self.state_service,
            vector_store_service=self.vector_store,
            knowledge_dir=self.knowledge_dir,
        )
        self.intelligence_service = TopicIntelligenceService(
            duplicate_service=self.duplicate_service,
            state_service=self.state_service,
        )

    def tearDown(self):
        self.temp_dir.cleanup()

    # 1. TOPIC SELECTION LOGIC (DETERMINISTIC, INTELLIGENT DISCOVERY)
    def test_topic_selection_is_deterministic_and_not_random(self):
        """Verifies topic ranking uses deterministic intelligence scoring, not random.choice."""
        user_topic = Topic(
            title="PostgreSQL MVCC Deep Dive",
            category="databases",
            description="How Postgres manages multi-version concurrency control.",
            source="user-request",
            difficulty="Advanced",
        )
        generic_topic = Topic(
            title="Basic HTML Tags",
            category="frontend",
            description="Overview of basic HTML syntax.",
            source="manual",
            difficulty="Beginner",
        )

        ranked = self.intelligence_service.rank_topics([generic_topic, user_topic])
        
        # User requested topic must score significantly higher due to source quality and depth
        self.assertGreater(len(ranked), 0)
        self.assertEqual(ranked[0].topic.title, "PostgreSQL MVCC Deep Dive")
        self.assertGreater(ranked[0].score, ranked[1].score)

    def test_knowledge_gap_provider_discovers_uncovered_categories(self):
        """Tests that KnowledgeGapProvider analyzes state and returns topics for underrepresented categories."""
        # Prepopulate state with 5 system-design topics
        for i in range(5):
            t = Topic(title=f"Distributed System Topic {i}", category="system-design")
            self.state_service.record_success(t, {"provider": "mock", "model": "mock"})

        provider = KnowledgeGapProvider(state_file_path=self.state_file)
        gap_topics = provider.get_topics()

        self.assertIsInstance(gap_topics, list)
        self.assertGreater(len(gap_topics), 0)
        gap_categories = {gt.category for gt in gap_topics}
        self.assertIn("backend", gap_categories | {"security", "networking", "devops", "cloud", "ai"})

    def test_user_request_provider_queue(self):
        """Tests that user-submitted topics are persisted and ingested into the discovery pool."""
        provider = UserRequestProvider(requests_file_path=self.req_file)
        
        # Add a requested topic
        success = provider.add_request(
            title="Raft Consensus Algorithm",
            category="distributed-systems",
            description="Leader election and log replication."
        )
        self.assertTrue(success)

        topics = provider.get_topics()
        self.assertEqual(len(topics), 1)
        self.assertEqual(topics[0].title, "Raft Consensus Algorithm")
        self.assertEqual(topics[0].source, "user-request")

    # 2. MANUAL NOTE GENERATION FLOW & DUPLICATE DETECTION
    def test_manual_note_duplicate_detection(self):
        """Verifies duplicate check identifies existing notes before generating."""
        # Record an existing note in state
        existing = Topic(
            title="Understanding Redis In-Memory Architecture",
            category="databases",
            description="Redis memory model and data structures."
        )
        self.state_service.record_success(existing, {"provider": "mock", "model": "mock"})

        # Check duplicate
        result_existing = self.duplicate_service.check_duplicate(
            Topic(title="Understanding Redis In-Memory Architecture", category="databases")
        )
        self.assertTrue(result_existing.is_duplicate)

        # Brand new topic should not be duplicate
        result_fresh = self.duplicate_service.check_duplicate(
            Topic(title="eBPF Kernel Tracing and Observability", category="devops")
        )
        self.assertFalse(result_fresh.is_duplicate)

    # 3. COURSE CURRICULUM STRUCTURE
    def test_course_curriculum_structure(self):
        """Verifies CourseService generates a structured curriculum with modules and lessons."""
        course_service = CourseService(ai_service=None, vector_store=self.vector_store)
        
        course = course_service.generate_course(
            topic="Distributed Systems and Raft",
            goal="Master consensus algorithms",
            level="Advanced",
        )

        self.assertIn("id", course)
        self.assertIn("title", course)
        self.assertIn("modules", course)
        self.assertGreater(len(course["modules"]), 0)

        module = course["modules"][0]
        self.assertIn("id", module)
        self.assertIn("title", module)
        self.assertIn("lessons", module)
        self.assertGreater(len(module["lessons"]), 0)

        lesson = module["lessons"][0]
        self.assertIn("id", lesson)
        self.assertIn("title", lesson)
        self.assertIn("explanation", lesson)
        self.assertTrue("codeExamples" in lesson or "codeExample" in lesson)
        self.assertTrue("practicalExercises" in lesson or "exercise" in lesson)
        self.assertTrue("assessment" in lesson or "assessmentQuestion" in lesson)
        self.assertTrue("commonMistakes" in lesson or "pitfalls" in lesson)

    # 4. INTERVIEW PREPARATION ENGINE
    def test_interview_plan_generation_structure(self):
        """Verifies InterviewService generates role-specific graded interview questions."""
        interview_service = InterviewService(ai_service=None)
        
        plan = interview_service.generate_interview_plan("Distributed Systems Engineer", "Senior (5-8 yrs)")
        
        self.assertIn("id", plan)
        self.assertEqual(plan["targetRole"], "Distributed Systems Engineer")
        self.assertIn("coreCompetencies", plan)
        self.assertIn("questions", plan)
        self.assertGreater(len(plan["questions"]), 0)

        difficulties = {q["difficulty"] for q in plan["questions"]}
        self.assertTrue({"Easy", "Medium", "Hard"}.intersection(difficulties))

        sample_q = plan["questions"][0]
        self.assertIn("question", sample_q)
        self.assertTrue("keyPointsToCover" in sample_q or "keyConcepts" in sample_q)
        self.assertTrue("modelAnswer" in sample_q or "modelAnswerOutline" in sample_q)

    def test_interview_answer_evaluation(self):
        """Verifies AI answer evaluation rubric scoring and feedback."""
        interview_service = InterviewService(ai_service=None)
        
        eval_result = interview_service.evaluate_answer(
            question="Explain CAP theorem and PACELC.",
            model_answer="In the presence of partitions, choose Consistency or Availability...",
            user_answer="In CAP, you can only choose two between Consistency, Availability, and Partition Tolerance.",
            role="Staff Engineer"
        )

        self.assertIn("score", eval_result)
        self.assertIn("strengths", eval_result)
        self.assertIn("areasForImprovement", eval_result)
        self.assertIn("modelAnswer", eval_result)
        self.assertIn("followUpQuestion", eval_result)
        self.assertIsInstance(eval_result["score"], (int, float))

    # 5. NOTIFICATION SERVICE
    def test_notification_service_subscription_and_dispatch(self):
        """Verifies Web Push notification registration and delivery logging."""
        notif_service = NotificationService(subscriptions_file=self.push_file)
        
        # Test subscription registration
        sub = {
            "endpoint": "https://fcm.googleapis.com/fcm/send/fake-sub-token-123",
            "keys": {"p256dh": "dummy-p256dh", "auth": "dummy-auth"}
        }
        res = notif_service.add_subscription(sub)
        self.assertTrue(res)

        subs = notif_service.get_subscriptions()
        self.assertEqual(len(subs), 1)
        self.assertEqual(subs[0]["endpoint"], sub["endpoint"])

        # Test daily note dispatch simulation
        sample_note = {
            "title": "Zero-Copy Networking in Linux with eBPF",
            "slug": "zero-copy-networking-linux-ebpf",
            "category": "networking",
            "readingTime": "8 min"
        }
        dispatch_report = notif_service.notify_daily_note(sample_note)
        self.assertIn("total_subscribers", dispatch_report)
        self.assertEqual(dispatch_report["total_subscribers"], 1)


if __name__ == "__main__":
    unittest.main()
