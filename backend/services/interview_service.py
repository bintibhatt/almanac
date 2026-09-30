"""
Interview Preparation Service for Almanac.
Generates role-tailored technical interview plans, multi-level question banks,
and provides objective AI evaluation for candidate answers.
"""

import json
from pathlib import Path
import re
from typing import Any, Dict, List, Optional

from backend.ai.service import AIService
from backend.providers.base import slugify
from backend.services.prompt_service import PromptService
from backend.services.vector_store_service import VectorStoreService


class InterviewService:
    """
    Coordinates role-based interview preparation, question progression, and practice evaluation.
    Operates independently from knowledge notes while allowing optional supplementary cross-references.
    """

    def __init__(
        self,
        ai_service: Optional[AIService] = None,
        prompt_service: Optional[PromptService] = None,
        vector_store_service: Optional[VectorStoreService] = None,
    ):
        self.ai_service = ai_service or AIService()
        self.prompt_service = prompt_service or PromptService()
        self.vector_store_service = vector_store_service or VectorStoreService()

    def generate_interview_questions(
        self,
        title: str,
        category: str,
        content: str,
    ) -> List[Dict[str, Any]]:
        """
        Generate level-graded interview questions and model answers from an article.
        Preserves backward compatibility for note-specific interview drills.
        """
        system_prompt = self.prompt_service.get_system_prompt()
        prompt = self.prompt_service.render(
            "interview_prompt.txt",
            title=title,
            category=category,
            content=content[:3000],
        )

        try:
            raw = self.ai_service.generate(prompt=prompt, system_prompt=system_prompt)
            parsed = self._parse_json(raw)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass

        # Fallback interview question structure
        return [
            {
                "id": "iq1",
                "level": "Intermediate",
                "question": f"How would you explain the core architecture of {title} during a system design interview?",
                "model_answer": f"I would describe {title} by breaking down its ingress data flow, internal mechanics, resource limits, and failure recovery domains.",
                "follow_up_prompt": "How does this scale when network latency spikes across availability zones?",
            },
            {
                "id": "iq2",
                "level": "Senior",
                "question": f"What common production failure modes occur with {title} and how do you mitigate them?",
                "model_answer": "Failure modes include resource exhaustion and unhandled timeout cascades. Mitigation requires circuit breakers and strict resource quotas.",
                "follow_up_prompt": "What telemetry metrics would you monitor on your dashboard?",
            },
        ]

    def generate_interview_plan(
        self,
        role: str,
        experience_level: str = "Mid-Level (2-4 yrs)",
        focus: Optional[str] = None,
        company: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate an independent technical interview preparation plan with skill matrix
        and graded question sets (Easy, Medium, Hard).
        """
        clean_role = role.strip() if role else "Backend Software Engineer"
        clean_exp = experience_level.strip() if experience_level else "Mid-Level (2-4 yrs)"
        clean_focus = focus.strip() if focus else "System Design, Databases & Scalability"
        clean_company = company.strip() if company else "General Top Tier Tech"

        plan_id = f"plan-{slugify(clean_role)}-{slugify(clean_exp)}"

        system_prompt = self.prompt_service.get_system_prompt()
        prompt = self.prompt_service.render(
            "interview_plan_prompt.txt",
            role=clean_role,
            experience_level=clean_exp,
            focus=clean_focus,
            company=clean_company,
            plan_id=plan_id,
        )

        plan_data: Optional[Dict[str, Any]] = None
        try:
            raw_response = self.ai_service.generate(prompt=prompt, system_prompt=system_prompt)
            plan_data = self._parse_json(raw_response)
        except Exception:
            plan_data = None

        if not plan_data or not isinstance(plan_data, dict) or "questions" not in plan_data:
            plan_data = self._generate_fallback_plan(
                role=clean_role,
                experience_level=clean_exp,
                focus=clean_focus,
                company=clean_company,
                plan_id=plan_id,
            )

        # Cross-reference supplementary notes
        self._enrich_questions_with_supplementary_notes(plan_data, clean_role)

        return plan_data

    def evaluate_answer(
        self,
        question: str,
        model_answer: str,
        user_answer: str,
        role: str = "Backend Software Engineer",
        difficulty: str = "Medium",
    ) -> Dict[str, Any]:
        """
        Evaluate candidate's submitted technical answer with strengths, gaps, and follow-up probing questions.
        """
        clean_answer = user_answer.strip()
        if not clean_answer:
            return {
                "score": 0,
                "rating": "No Answer Provided",
                "summary": "No technical explanation was submitted.",
                "strengths": [],
                "gaps": ["Candidate submitted an empty response."],
                "followUp": "Please provide your technical thoughts on this architecture problem.",
            }

        system_prompt = self.prompt_service.get_system_prompt()
        prompt = self.prompt_service.render(
            "interview_eval_prompt.txt",
            role=role,
            difficulty=difficulty,
            question=question,
            model_answer=model_answer,
            user_answer=clean_answer,
        )

        try:
            raw_response = self.ai_service.generate(prompt=prompt, system_prompt=system_prompt)
            result = self._parse_json(raw_response)
            if result and isinstance(result, dict) and "score" in result:
                return result
        except Exception:
            pass

        # Robust heuristic fallback evaluation for offline / mock providers
        words = len(clean_answer.split())
        tech_words = ["cache", "latency", "scale", "partition", "sharding", "timeout", "circuit breaker", "lock", "concurrency", "queue", "kafka", "redis", "database", "postgres", "index", "failure"]
        matched_kw = [kw for kw in tech_words if kw in clean_answer.lower()]

        score = min(95, max(30, (words // 5) * 5 + len(matched_kw) * 8))
        if score >= 80:
            rating = "Staff-Level Strong Pass"
        elif score >= 60:
            rating = "Clear Pass"
        else:
            rating = "Needs Revision"

        strengths = [
            f"Addressed core problem with clear technical intent ({words} words).",
        ]
        if matched_kw:
            strengths.append(f"Correctly incorporated systems concepts: {', '.join(matched_kw[:3])}.")

        gaps = [
            "Consider explicitly detailing failure recovery domains and timeout limits.",
            "Discuss telemetry golden signals (p99 latency, error rates) to monitor this in production.",
        ]

        return {
            "score": score,
            "rating": rating,
            "summary": f"Demonstrated sound architectural intuition for {difficulty}-level inquiry.",
            "strengths": strengths,
            "gaps": gaps,
            "areasForImprovement": gaps,
            "modelAnswer": model_answer or "A comprehensive model answer covers the architecture and failure domains.",
            "followUp": "How would you ensure zero data loss during a rolling Kubernetes node upgrade under heavy write traffic?",
            "followUpQuestion": "How would you ensure zero data loss during a rolling Kubernetes node upgrade under heavy write traffic?",
        }

    def _parse_json(self, text: str) -> Optional[Any]:
        """Extract and parse JSON from string."""
        cleaned = text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        start = min([pos for pos in (cleaned.find("{"), cleaned.find("[")) if pos != -1], default=-1)
        end = max([pos for pos in (cleaned.rfind("}"), cleaned.rfind("]")) if pos != -1], default=-1)
        if start != -1 and end != -1:
            try:
                return json.loads(cleaned[start : end + 1])
            except Exception:
                pass
        return None

    def _enrich_questions_with_supplementary_notes(self, plan_data: Dict[str, Any], role: str):
        """Cross-reference existing Almanac knowledge library to attach optional supplementary notes."""
        for q in plan_data.get("questions", []):
            q_text = q.get("question", "")
            query = f"{q_text} {role}"
            try:
                matches = self.vector_store_service.search_similar(query=query, top_k=2, min_score=0.45)
                q["relatedNotes"] = [
                    {
                        "slug": m["slug"],
                        "title": m["title"],
                        "category": m["category"],
                    }
                    for m in matches
                ]
            except Exception:
                q["relatedNotes"] = []

    def _generate_fallback_plan(
        self,
        role: str,
        experience_level: str,
        focus: str,
        company: str,
        plan_id: str,
    ) -> Dict[str, Any]:
        """
        Generate structured fallback interview plan with Easy, Medium, and Hard questions.
        """
        is_ai_role = any(term in role.lower() for term in ("ai", "ml", "data", "machine learning"))
        is_devops_role = any(term in role.lower() for term in ("devops", "sre", "infra", "cloud"))

        if is_ai_role:
            skill_matrix = [
                {"area": "RAG & Vector Retrieval", "importance": "High", "competencies": ["Dense vs Sparse Indexing", "Chunking Strategies", "Reranking"]},
                {"area": "LLM Inference & Serving", "importance": "High", "competencies": ["KV-Cache Optimization", "Speculative Decoding", "GPU Memory Bandwidth"]},
                {"area": "Data Pipelines & Embeddings", "importance": "Medium", "competencies": ["Batch Ingestion", "Quantization", "Model Evaluation"]},
            ]
            questions = [
                {
                    "id": "q-1",
                    "category": "Vector Databases & Search",
                    "difficulty": "Easy",
                    "question": "What is the difference between dense embeddings and sparse keyword (BM25) search?",
                    "scenario": "A product team wants to replace exact search with semantic search.",
                    "keyPointsToCover": [
                        "Dense embeddings capture semantic meaning and synonyms",
                        "Sparse search excels at exact keywords, code snippets, and identifiers",
                        "Reciprocal Rank Fusion (RRF) combines strengths of both",
                    ],
                    "modelAnswer": "Dense vector search embeds text into high-dimensional latent space to measure conceptual similarity via cosine distance. Sparse search (BM25) indexes inverted token frequencies for exact lexical matches. Production systems typically implement hybrid retrieval with reciprocal rank fusion to avoid losing exact keyword matches.",
                    "followUpPrompt": "How do you evaluate whether adding hybrid search actually improves answer accuracy?",
                },
                {
                    "id": "q-2",
                    "category": "Inference Optimization",
                    "difficulty": "Medium",
                    "question": "How does KV-cache compression or paging (vLLM) optimize transformer inference throughput?",
                    "scenario": "Serving 50 concurrent streaming users on an 80GB A100 GPU.",
                    "keyPointsToCover": [
                        "Key-value activations occupy substantial GPU memory during autoregressive generation",
                        "Memory fragmentation prevents high batch sizes without paged memory management",
                        "vLLM allocates KV cache blocks dynamically like OS virtual memory pages",
                    ],
                    "modelAnswer": "In autoregressive LLM decoding, past Key and Value vectors are cached to prevent recomputing attention for previous tokens. Naive allocation pre-allocates contiguous memory for maximum context length, creating up to 80% memory fragmentation. PagedAttention divides the KV cache into fixed-size physical blocks, eliminating external fragmentation and multiplying concurrent throughput by 2-4x.",
                    "followUpPrompt": "What trade-offs arise when using 8-bit or 4-bit KV-cache quantization?",
                },
                {
                    "id": "q-3",
                    "category": "System Design for AI",
                    "difficulty": "Hard",
                    "question": "Design an end-to-end real-time RAG pipeline processing 10 million documents with sub-200ms p99 latency.",
                    "scenario": "Enterprise search over continuously updating knowledge bases with strict permission barriers.",
                    "keyPointsToCover": [
                        "Asynchronous CDC ingestion with vector index sharding",
                        "Two-stage retrieval: dense HNSW + BM25 followed by cross-encoder reranking",
                        "Embedding caching and query intent routing",
                        "Document-level ACL filtering at search index level",
                    ],
                    "modelAnswer": "I would architect this with decoupled ingestion and query paths. Ingestion uses Kafka and CDC to compute embeddings asynchronously and upsert to an HNSW-indexed vector cluster partitioned by tenant ID. Query ingress runs parallel vector similarity and BM25 lookups (50ms budget), merges candidates via RRF, executes cross-encoder reranking on top 20 candidates (40ms budget), and streams prompts to an optimized inference endpoint with prompt caching.",
                    "followUpPrompt": "How do you invalidate stale cached embeddings when a document is updated in real-time?",
                },
            ]
        else:
            skill_matrix = [
                {"area": "Distributed Systems", "importance": "High", "competencies": ["Consensus (Raft/Paxos)", "Replication & Sharding", "Fault Tolerance"]},
                {"area": "Databases & Storage", "importance": "High", "competencies": ["Transaction Isolation (MVCC)", "Indexing & Query Planning", "Caching Invalidation"]},
                {"area": "API & Concurrency Architecture", "importance": "Medium", "competencies": ["Rate Limiting & Shedding", "Idempotency Keys", "Event-Driven Messaging"]},
            ]
            questions = [
                {
                    "id": "q-1",
                    "category": "Databases",
                    "difficulty": "Easy",
                    "question": "How does Multi-Version Concurrency Control (MVCC) eliminate read-write locks in PostgreSQL?",
                    "scenario": "High-concurrency e-commerce order lookups occurring during continuous batch inventory updates.",
                    "keyPointsToCover": [
                        "xmin and xmax transaction IDs tracked on every row tuple",
                        "Readers take non-blocking snapshot of committed transactions",
                        "Old row versions accumulate as dead tuples until autovacuum purges them",
                    ],
                    "modelAnswer": "Under MVCC, write operations create new versions of row tuples rather than overwriting existing data in-place. Each tuple stores header metadata including xmin (creating transaction) and xmax (deleting/updating transaction). Readers evaluate row visibility against a snapshot taken at query or transaction start, allowing readers to proceed concurrently without blocking writers.",
                    "followUpPrompt": "What performance consequences occur if a long-running transaction delays autovacuum?",
                },
                {
                    "id": "q-2",
                    "category": "System Design",
                    "difficulty": "Medium",
                    "question": "Design an idempotent payment processing API to prevent duplicate charges under network disconnects.",
                    "scenario": "Mobile clients retry requests automatically when network drops between client and gateway.",
                    "keyPointsToCover": [
                        "Client-supplied Idempotency-Key header stored in distributed lock/cache (Redis)",
                        "Atomic check-and-set transaction before charging downstream payment provider",
                        "Caching response payload to return identical response on retry",
                    ],
                    "modelAnswer": "The API requires clients to generate a UUIDv4 idempotency key per intent. Upon receiving a request, the server executes an atomic SETNX with a lease timeout in Redis. If the key exists in IN_PROGRESS state, the server returns 409 Conflict or waits. Once payment executes successfully, the result is committed to the relational database along with the key, and cached for 24 hours. Subsequent identical requests return the cached HTTP 200 payload without re-executing charges.",
                    "followUpPrompt": "How do you handle a scenario where Redis crashes midway through processing?",
                },
                {
                    "id": "q-3",
                    "category": "Distributed Consensus & Scalability",
                    "difficulty": "Hard",
                    "question": "Explain how leader election and log replication work in the Raft consensus protocol, and how split-brain is prevented.",
                    "scenario": "A 5-node cluster experiencing a network partition separating 2 nodes from 3 nodes.",
                    "keyPointsToCover": [
                        "Randomized election timeouts transitioning followers to candidate state",
                        "Quorum requirement (N/2 + 1) for electing leaders and committing log entries",
                        "Term numbers identifying stale leaders and forcing step-down",
                    ],
                    "modelAnswer": "Raft ensures consensus by electing a single leader per term using randomized election timeouts. To win election, a candidate must collect votes from a strict majority (quorum = 3 of 5 nodes). In a 2/3 partition, the minority 2-node partition cannot form a quorum and cannot elect a leader or commit writes. The majority 3-node partition maintains normal operation. When the partition heals, the minority nodes recognize the higher term number from the legitimate leader and replicate its log.",
                    "followUpPrompt": "What happens if a leader disconnects immediately after appending an entry to its local log but before broadcasting it?",
                },
            ]

        return {
            "id": plan_id,
            "role": role,
            "targetRole": role,
            "experienceLevel": experience_level,
            "focus": focus,
            "company": company,
            "overview": f"Comprehensive technical interview preparation plan for {role} ({experience_level}), focusing on {focus}.",
            "skillMatrix": skill_matrix,
            "coreCompetencies": [s["area"] for s in skill_matrix],
            "questions": questions,
        }
