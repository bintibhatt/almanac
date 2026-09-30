"""
Course Generation & Learning Path Service for Almanac.
Generates structured, independent engineering curricula and deep-dive lessons
tailored to user learning goals, levels, and time commitments.
"""

from dataclasses import dataclass, field
import json
import re
from typing import Any, Dict, List, Optional

from backend.ai.service import AIService
from backend.providers.base import slugify
from backend.services.prompt_service import PromptService
from backend.services.vector_store_service import VectorStoreService


class CourseService:
    """
    Coordinates curriculum planning, prerequisite analysis, and lesson generation.
    Courses are independently generated learning experiences that can optionally
    reference Almanac notes as supplementary resources.
    """

    def __init__(
        self,
        ai_service: Optional[AIService] = None,
        prompt_service: Optional[PromptService] = None,
        vector_store_service: Optional[VectorStoreService] = None,
        vector_store: Optional[VectorStoreService] = None,
    ):
        self.ai_service = ai_service or AIService()
        self.prompt_service = prompt_service or PromptService()
        self.vector_store_service = vector_store_service or vector_store or VectorStoreService()

    def generate_course(
        self,
        topic: str,
        level: str = "Intermediate",
        goal: Optional[str] = None,
        time_commitment: Optional[str] = None,
        learning_style: Optional[str] = None,
        target_deadline: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive, structured course based on user learning goals.
        """
        clean_topic = topic.strip()
        if not clean_topic:
            raise ValueError("Course topic cannot be empty.")
        if len(clean_topic) > 150:
            raise ValueError("Topic title exceeds maximum allowed length (150 characters).")

        level_normalized = level.strip().capitalize() if level else "Intermediate"
        if level_normalized not in ("Beginner", "Intermediate", "Advanced"):
            level_normalized = "Intermediate"

        user_goal = goal.strip() if goal else f"Master {clean_topic} from core mechanics to production architecture."
        user_time = time_commitment.strip() if time_commitment else "1 hour per day"
        user_style = learning_style.strip() if learning_style else "Hands-on engineering & architecture"
        user_deadline = target_deadline.strip() if target_deadline else "4 weeks"

        course_id = f"course-{slugify(clean_topic)}"

        # 1. Attempt AI Generation
        system_prompt = self.prompt_service.get_system_prompt()
        prompt = self.prompt_service.render(
            "course_prompt.txt",
            topic=clean_topic,
            level=level_normalized,
            goal=user_goal,
            time_commitment=user_time,
            learning_style=user_style,
            target_deadline=user_deadline,
            course_id=course_id,
            title=f"{clean_topic}: Architecture & Engineering Mastery",
            description=f"In-depth course covering foundational mechanics, system architecture, failure modes, and production patterns for {clean_topic}.",
        )

        course_data: Optional[Dict[str, Any]] = None
        try:
            raw_response = self.ai_service.generate(prompt=prompt, system_prompt=system_prompt)
            course_data = self._parse_json(raw_response)
        except Exception:
            course_data = None

        # 2. Fallback to structured deterministic curriculum generator if AI response invalid or mock
        if not course_data or not isinstance(course_data, dict) or "modules" not in course_data:
            course_data = self._generate_fallback_course(
                topic=clean_topic,
                level=level_normalized,
                goal=user_goal,
                time_commitment=user_time,
                learning_style=user_style,
                target_deadline=user_deadline,
                course_id=course_id,
            )

        # 3. Enrich Lessons with Supplementary Almanac Notes
        self._enrich_lessons_with_supplementary_notes(course_data, clean_topic)

        return course_data

    def _parse_json(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract and parse JSON from LLM output."""
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        # Find first { and last }
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(cleaned[start : end + 1])
            except Exception:
                pass
        return None

    def _enrich_lessons_with_supplementary_notes(self, course_data: Dict[str, Any], main_topic: str):
        """
        Cross-reference existing Almanac knowledge library to attach optional
        supplementary reading links to course lessons.
        """
        for module in course_data.get("modules", []):
            for lesson in module.get("lessons", []):
                lesson_title = lesson.get("title", "")
                query = f"{lesson_title} {main_topic}"

                try:
                    matches = self.vector_store_service.search_similar(query=query, top_k=2, min_score=0.45)
                    related = [
                        {
                            "slug": m["slug"],
                            "title": m["title"],
                            "category": m["category"],
                            "score": round(m["score"], 2),
                        }
                        for m in matches
                    ]
                    lesson["relatedNotes"] = related
                except Exception:
                    lesson["relatedNotes"] = []

    def _generate_fallback_course(
        self,
        topic: str,
        level: str,
        goal: str,
        time_commitment: str,
        learning_style: str,
        target_deadline: str,
        course_id: str,
    ) -> Dict[str, Any]:
        """
        High-quality, curriculum generator for offline/mock environments.
        Produces realistic modular structure with exercises, assessments, and code examples.
        """
        return {
            "id": course_id,
            "title": f"{topic}: Systems Architecture & Deep-Dive",
            "description": f"A comprehensive, production-grade engineering course designed to take you through {topic} fundamentals, internal mechanisms, failure domains, and real-world system design.",
            "level": level,
            "estimatedDuration": "6 to 8 hours",
            "goal": goal,
            "timeCommitment": time_commitment,
            "learningStyle": learning_style,
            "targetDeadline": target_deadline,
            "prerequisites": [
                "Basic operating systems & networking fundamentals",
                "Familiarity with distributed client-server architecture",
                "Proficiency in at least one modern backend programming language",
            ],
            "modules": [
                {
                    "id": "module-1",
                    "title": f"Module 1 — {topic} Foundations & Core Mental Models",
                    "description": f"Deconstruct the problem domain, foundational mechanics, and core abstractions that define {topic}.",
                    "lessons": [
                        {
                            "id": "lesson-1-1",
                            "title": f"Why {topic} Exists: Architectural Motivations & Tradeoffs",
                            "objective": f"Understand the historical problems, operational constraints, and fundamental tradeoffs that necessitate {topic}.",
                            "estimatedMinutes": 30,
                            "difficulty": level,
                            "explanation": (
                                f"In modern large-scale distributed architectures, systems must handle concurrency, network partitions, and variable load. "
                                f"{topic} addresses these challenges by introducing deterministic boundaries, resource isolation, and explicit contracts. "
                                f"Without these patterns, systems suffer from unbounded tail latencies, cascading failure modes, and state inconsistency."
                            ),
                            "prerequisites": ["Basic systems thinking"],
                            "concepts": [
                                {
                                    "name": "Bounded Context & Invariant Enforcement",
                                    "explanation": "Guarantees that state mutations conform to explicit validation barriers before committing to disk or replication logs.",
                                    "keyTakeaway": "Never allow uncoordinated writes across unpartitioned state boundaries.",
                                },
                                {
                                    "name": "Tradeoff Matrix: Consistency vs Latency",
                                    "explanation": "Every architectural decision in this space balances write latency against read freshness guarantees.",
                                    "keyTakeaway": "Choose asynchronous replication when low latency dominates over strict serializability.",
                                },
                            ],
                            "codeExamples": [
                                {
                                    "language": "python",
                                    "title": "Configuring Resilient Timeouts & Retries",
                                    "code": (
                                        "import time\n"
                                        "import httpx\n\n"
                                        "# Enforce strict timeout barriers on external dependencies\n"
                                        "client = httpx.Client(\n"
                                        "    timeout=httpx.Timeout(connect=2.0, read=5.0, write=5.0, pool=10.0),\n"
                                        "    limits=httpx.Limits(max_keepalive_connections=20, max_connections=100)\n"
                                        ")\n\n"
                                        "def safe_execute(endpoint: str):\n"
                                        "    for attempt in range(3):\n"
                                        "        try:\n"
                                        "            resp = client.get(endpoint)\n"
                                        "            if resp.status_code == 200:\n"
                                        "                return resp.json()\n"
                                        "        except httpx.RequestError as err:\n"
                                        "            backoff = (2 ** attempt) * 0.25\n"
                                        "            time.sleep(backoff)\n"
                                        "    raise RuntimeError('Dependency unavailable')\n"
                                    ),
                                    "explanation": "Demonstrates exponential backoff with jitter and connection pooling limits to avoid connection starvation.",
                                }
                            ],
                            "practicalExercises": [
                                {
                                    "id": "ex-1-1",
                                    "title": "Analyze Failure Scenarios",
                                    "prompt": f"Given a cluster running {topic}, assume a 200ms latency spike between primary and replica nodes. What metrics would indicate backpressure?",
                                    "hints": ["Look at queue depths, write buffer queues, and connection pool saturation."],
                                    "solution": "Backpressure manifests as saturated client connection pools, elevated p99 response times, and growing replication lag lag_bytes gauges.",
                                }
                            ],
                            "assessment": [
                                {
                                    "id": "q-1-1",
                                    "question": f"What is the primary risk of omitting explicit timeouts in {topic} client configurations?",
                                    "options": [
                                        "Instant process crash with SIGSEGV",
                                        "Thread and socket pool starvation leading to cascading outages",
                                        "Automatic downgrade to HTTP/1.0",
                                        "Database index corruption",
                                    ],
                                    "correctIndex": 1,
                                    "explanation": "Unbounded network calls block execution threads, rapidly exhausting thread pools and starving incoming traffic.",
                                }
                            ],
                            "commonMistakes": [
                                "Relying on default infinite socket timeouts in production SDKs.",
                                "Synchronously blocking on external dependencies in the hot request path.",
                            ],
                            "checkpoint": f"You can explain why {topic} is chosen over naive monolithic alternatives and identify its primary failure modes.",
                            "furtherReading": [
                                "The Google File System & MapReduce Papers",
                                "CAP Theorem and Beyond: PACELC Architectural Taxonomy",
                            ],
                        },
                        {
                            "id": "lesson-1-2",
                            "title": f"Internal Mechanics & Data Flow in {topic}",
                            "objective": f"Trace data ingress, storage layouts, and message flows inside {topic}.",
                            "estimatedMinutes": 35,
                            "difficulty": level,
                            "explanation": (
                                f"At its core, {topic} processes incoming requests through a pipeline of validation, buffering, and persistence. "
                                f"Understanding this data lifecycle enables engineers to anticipate bottlenecks and optimize throughput."
                            ),
                            "prerequisites": [f"Lesson 1: Why {topic} Exists"],
                            "concepts": [
                                {
                                    "name": "Write-Ahead Logging (WAL)",
                                    "explanation": "Sequential disk append guaranteeing durability before memory buffer flushing.",
                                    "keyTakeaway": "Sequential writes are 10-100x faster than random I/O on rotating disks and SSDs alike.",
                                },
                                {
                                    "name": "Zero-Allocation Buffers",
                                    "explanation": "Reusing memory ring buffers to prevent garbage collection pauses during high ingestion.",
                                    "keyTakeaway": "GC pauses directly inflate p999 tail latency.",
                                },
                            ],
                            "codeExamples": [
                                {
                                    "language": "python",
                                    "title": "Buffer Ingestion Pipeline",
                                    "code": (
                                        "from collections import deque\n\n"
                                        "class IngestionBuffer:\n"
                                        "    def __init__(self, max_capacity: int = 1000):\n"
                                        "        self._queue = deque(maxlen=max_capacity)\n\n"
                                        "    def append(self, event: dict) -> bool:\n"
                                        "        if len(self._queue) >= self._queue.maxlen:\n"
                                        "            # Reject or apply backpressure\n"
                                        "            return False\n"
                                        "        self._queue.append(event)\n"
                                        "        return True\n"
                                    ),
                                    "explanation": "A bounded ring buffer rejecting overflow items rather than causing Out-Of-Memory (OOM) faults.",
                                }
                            ],
                            "practicalExercises": [
                                {
                                    "id": "ex-1-2",
                                    "title": "Calculate Buffer Sizing",
                                    "prompt": "If ingestion rate is 10,000 req/s and disk flush takes 50ms, what is the minimum memory buffer size required to prevent dropped requests?",
                                    "hints": ["Buffer = Rate * Time"],
                                    "solution": "10,000 req/s * 0.050s = 500 items minimum buffer capacity.",
                                }
                            ],
                            "assessment": [
                                {
                                    "id": "q-1-2",
                                    "question": "Why is sequential appending to a Write-Ahead Log faster than directly updating B-Tree leaf pages on disk?",
                                    "options": [
                                        "WAL skips operating system page cache entirely",
                                        "Sequential I/O minimizes disk head movement and flash block re-allocation",
                                        "B-Trees cannot be stored on NVMe drives",
                                        "WAL uses quantum compression",
                                    ],
                                    "correctIndex": 1,
                                    "explanation": "Sequential writes avoid random page lookups and page rewrites.",
                                }
                            ],
                            "commonMistakes": [
                                "Failing to cap queue sizes in memory, inviting Linux OOM killer.",
                                "Calling fsync() on every single transaction without batching.",
                            ],
                            "checkpoint": "You can describe step-by-step how data moves from network ingress to durable storage.",
                            "furtherReading": [
                                "Anatomy of an LSM-Tree (RocksDB Architecture Guide)",
                            ],
                        },
                    ],
                },
                {
                    "id": "module-2",
                    "title": f"Module 2 — Resiliency, Scalability & Production Hardening",
                    "description": f"Learn how to scale {topic} across nodes, handle network partitions, and operate with zero downtime.",
                    "lessons": [
                        {
                            "id": "lesson-2-1",
                            "title": f"Concurrency, Partitioning & Load Balancing for {topic}",
                            "objective": f"Architect horizontal partitioning and traffic routing for high-throughput {topic} deployments.",
                            "estimatedMinutes": 40,
                            "difficulty": level,
                            "explanation": (
                                f"Single-node implementations of {topic} eventually hit vertical scaling limits. "
                                f"This lesson covers consistent hashing, partition rebalancing, and read-replica routing to distribute workloads effectively."
                            ),
                            "prerequisites": ["Module 1 completion"],
                            "concepts": [
                                {
                                    "name": "Consistent Hashing Ring",
                                    "explanation": "Distributes keys across nodes using virtual nodes to prevent hot spots when nodes join or leave.",
                                    "keyTakeaway": "Rebalancing only moves K/N keys where K is key count and N is node count.",
                                },
                                {
                                    "name": "Circuit Breaker Pattern",
                                    "explanation": "Fails fast when downstream dependencies degrade, preventing cascading queue pileups.",
                                    "keyTakeaway": "Fail fast rather than holding client connections open until timeout.",
                                },
                            ],
                            "codeExamples": [
                                {
                                    "language": "python",
                                    "title": "Circuit Breaker Implementation",
                                    "code": (
                                        "import time\n\n"
                                        "class CircuitBreaker:\n"
                                        "    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 30.0):\n"
                                        "        self.failure_threshold = failure_threshold\n"
                                        "        self.recovery_timeout = recovery_timeout\n"
                                        "        self.failures = 0\n"
                                        "        self.state = 'CLOSED'\n"
                                        "        self.last_failure_time = 0.0\n\n"
                                        "    def can_execute(self) -> bool:\n"
                                        "        if self.state == 'OPEN':\n"
                                        "            if time.time() - self.last_failure_time > self.recovery_timeout:\n"
                                        "                self.state = 'HALF_OPEN'\n"
                                        "                return True\n"
                                        "            return False\n"
                                        "        return True\n"
                                    ),
                                    "explanation": "Three-state state machine (CLOSED, OPEN, HALF_OPEN) guarding downstream services.",
                                }
                            ],
                            "practicalExercises": [
                                {
                                    "id": "ex-2-1",
                                    "title": "Design Sharding Strategy",
                                    "prompt": f"Given 50 million active users on {topic}, propose a shard key that avoids write skew.",
                                    "hints": ["Avoid monotonic timestamps or auto-incrementing IDs as shard keys."],
                                    "solution": "Use a hash of tenant_id or user_uuid combined with consistent hashing to spread writes uniformly.",
                                }
                            ],
                            "assessment": [
                                {
                                    "id": "q-2-1",
                                    "question": "What happens if you use a monotonically increasing timestamp as your primary partition key in a distributed database?",
                                    "options": [
                                        "All writes will be evenly distributed across all cluster shards",
                                        "All concurrent writes will hammer the single node holding the latest timestamp partition, creating a write hotspot",
                                        "The cluster will automatically elect a new coordinator",
                                        "Read queries will execute in O(1) time across all nodes",
                                    ],
                                    "correctIndex": 1,
                                    "explanation": "Monotonic keys direct all current traffic to the single active partition boundary.",
                                }
                            ],
                            "commonMistakes": [
                                "Sharding on high-cardinality keys that force broadcast queries for common lookups.",
                                "Neglecting jitter in reconnect logic, leading to thundering herd storms.",
                            ],
                            "checkpoint": "You can design a partition schema and implement circuit breaking for production traffic.",
                            "furtherReading": [
                                "Amazon Dynamo Paper: Highly Available Key-Value Store",
                            ],
                        }
                    ],
                },
                {
                    "id": "module-3",
                    "title": f"Module 3 — Observability, Incident Management & Future Patterns",
                    "description": f"Master telemetry metrics, runbooks, and staff-level architectural evolution for {topic}.",
                    "lessons": [
                        {
                            "id": "lesson-3-1",
                            "title": f"Production Telemetry, Golden Signals & Failure Diagnostics",
                            "objective": f"Instrument {topic} with Prometheus metrics, OpenTelemetry traces, and actionable alert runbooks.",
                            "estimatedMinutes": 35,
                            "difficulty": level,
                            "explanation": (
                                f"Operating {topic} in production requires visibility into Latency, Traffic, Errors, and Saturation (the Four Golden Signals). "
                                f"This lesson guides you through constructing SLIs, SLOs, and diagnosing real-world incident scenarios."
                            ),
                            "prerequisites": ["Module 2 completion"],
                            "concepts": [
                                {
                                    "name": "The Four Golden Signals",
                                    "explanation": "Latency, Traffic, Errors, and Saturation provide the foundational telemetry for any distributed service.",
                                    "keyTakeaway": "Always alert on Symptoms (high error rate) rather than Causes (CPU at 80%).",
                                },
                                {
                                    "name": "Tracing Distributed Span Propagation",
                                    "explanation": "Passing traceparent headers across RPC boundaries to correlate requests end-to-end.",
                                    "keyTakeaway": "Correlating logs with trace IDs reduces mean time to resolution (MTTR) by 70%.",
                                },
                            ],
                            "codeExamples": [
                                {
                                    "language": "python",
                                    "title": "Prometheus Metric Instrumentation",
                                    "code": (
                                        "from prometheus_client import Counter, Histogram\n\n"
                                        "REQUEST_LATENCY = Histogram(\n"
                                        "    'topic_request_duration_seconds',\n"
                                        "    'Latency of operations in seconds',\n"
                                        "    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5]\n"
                                        ")\n"
                                        "ERROR_COUNTER = Counter(\n"
                                        "    'topic_errors_total',\n"
                                        "    'Total errors encountered',\n"
                                        "    ['error_type']\n"
                                        ")\n\n"
                                        "@REQUEST_LATENCY.time()\n"
                                        "def process_operation():\n"
                                        "    pass\n"
                                    ),
                                    "explanation": "Histograms record duration distributions to accurately compute p95 and p99 percentiles without averaging averages.",
                                }
                            ],
                            "practicalExercises": [
                                {
                                    "id": "ex-3-1",
                                    "title": "Draft an Incident Runbook",
                                    "prompt": f"Write a 3-step triage checklist for an engineer paged when {topic} p99 latency spikes above 2 seconds.",
                                    "hints": ["Check saturation, downstream errors, and active node health."],
                                    "solution": "1. Check database/cache connection pool saturation. 2. Verify replica lag and error rates. 3. Engage circuit breaker to shed non-essential traffic.",
                                }
                            ],
                            "assessment": [
                                {
                                    "id": "q-3-1",
                                    "question": "Why should you never calculate overall cluster latency by taking the average of averages from each node?",
                                    "options": [
                                        "Averages cannot be represented in floating point numbers",
                                        "Averages hide extreme tail latency outliers (p99/p999) that impact actual users",
                                        "Prometheus does not support math operations",
                                        "TCP packets discard timestamp metadata",
                                    ],
                                    "correctIndex": 1,
                                    "explanation": "Mathematical averages completely mask severe outliers where a small percentage of users experience crippling latency.",
                                }
                            ],
                            "commonMistakes": [
                                "Alerting on CPU percentage rather than user-facing error rates and latency.",
                                "High-cardinality label explosion in metric tags (e.g. putting user_id in Prometheus metrics).",
                            ],
                            "checkpoint": f"You can build production monitoring dashboards and incident runbooks for {topic}.",
                            "furtherReading": [
                                "Site Reliability Engineering (SRE) Book — Google",
                            ],
                        }
                    ],
                },
            ],
        }
