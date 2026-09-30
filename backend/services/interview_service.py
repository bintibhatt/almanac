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
        question_count: int = 6,
    ) -> Dict[str, Any]:
        """
        Generate an independent technical interview preparation plan with skill matrix
        and graded question sets (Easy, Medium, Hard).
        """
        clean_role = role.strip() if role else "Backend Software Engineer"
        clean_exp = experience_level.strip() if experience_level else "Mid-Level (2-4 yrs)"
        clean_focus = focus.strip() if focus else "System Design, Databases & Scalability"
        clean_company = company.strip() if company else "General Top Tier Tech"
        clean_count = max(3, min(15, int(question_count) if question_count else 6))

        plan_id = f"plan-{slugify(clean_role)}-{slugify(clean_exp)}"

        system_prompt = self.prompt_service.get_system_prompt()
        prompt = self.prompt_service.render(
            "interview_plan_prompt.txt",
            role=clean_role,
            experience_level=clean_exp,
            focus=clean_focus,
            company=clean_company,
            question_count=clean_count,
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
                question_count=clean_count,
            )

        # Ensure returned questions strictly match requested question_count
        if "questions" in plan_data and isinstance(plan_data["questions"], list):
            q_list = plan_data["questions"]
            if len(q_list) > clean_count:
                plan_data["questions"] = q_list[:clean_count]
            elif len(q_list) < clean_count:
                while len(q_list) < clean_count:
                    idx = len(q_list) + 1
                    diff = "Medium" if idx % 2 == 0 else "Hard"
                    q_list.append({
                        "id": f"q-{idx}",
                        "category": f"Architecture & System Design",
                        "difficulty": diff,
                        "question": f"How do you architect, operate, and troubleshoot {clean_focus or clean_role} workloads under extreme production stress (Scenario {idx})?",
                        "scenario": f"High-scale production architecture requirements for {clean_role} at {clean_company}.",
                        "keyPointsToCover": [
                            "Decoupled service boundaries and fault isolation",
                            "Telemetry signals, p99 latency SLAs, and error budgets",
                            "Data consistency, failover, and disaster recovery",
                        ],
                        "modelAnswer": f"For {clean_role} architecture, I prioritize decoupled boundaries, circuit breakers, idempotency, backpressure, and comprehensive telemetry across failure domains.",
                        "followUpPrompt": "How would you automate testing for this failure scenario in pre-production staging?",
                    })
                plan_data["questions"] = q_list

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
        question_count: int = 6,
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
                {
                    "id": "q-4",
                    "category": "Embeddings & Mathematics",
                    "difficulty": "Easy",
                    "question": "When should you use Cosine Similarity versus Dot Product or Euclidean (L2) distance for vector retrieval?",
                    "scenario": "Comparing similarity between normalized text embeddings generated by OpenAI or Cohere.",
                    "keyPointsToCover": [
                        "Cosine similarity measures the angle between vectors independent of magnitude",
                        "Dot product equals cosine similarity if vectors are unit-normalized (length = 1)",
                        "L2 distance measures Euclidean geometric distance",
                        "Dot product is computationally faster when unit-normalized",
                    ],
                    "modelAnswer": "Cosine similarity measures the cosine of the angle between two vectors, effectively normalizing their lengths. If embeddings are already unit-normalized (magnitude = 1), dot product and cosine similarity produce identical relative rankings, but dot product requires fewer floating-point operations. L2 distance measures absolute distance in Euclidean space, which is sensitive to embedding magnitude.",
                    "followUpPrompt": "How does vector quantization (e.g. PQ or binary quantization) affect distance calculation accuracy?",
                },
                {
                    "id": "q-5",
                    "category": "Context Engineering & Chunking",
                    "difficulty": "Medium",
                    "question": "What are the trade-offs between fixed-size chunking, sentence-window retrieval, and hierarchical (parent-child) chunking?",
                    "scenario": "Indexing dense financial 10-K filings with embedded tables and footnotes.",
                    "keyPointsToCover": [
                        "Fixed chunking suffers from split context boundaries and incomplete thoughts",
                        "Sentence-window embeds individual sentences but injects surrounding context window to LLM",
                        "Hierarchical indexing retrieves granular chunks for search precision but passes parent document chunk for generation",
                    ],
                    "modelAnswer": "Fixed-size chunking is simple but frequently severs semantic clauses across chunk boundaries. Sentence-window retrieval embeds small, highly specific sentences to maximize search similarity precision, then substitutes a wider surrounding context window when synthesizing the prompt. Parent-child chunking indexes small 128-token child chunks for dense vector matching, but resolves the match to an overarching 1024-token parent chunk for LLM generation, preserving structural coherence.",
                    "followUpPrompt": "How do you preserve tabular relationships across chunk splits?",
                },
                {
                    "id": "q-6",
                    "category": "LLM Serving & Latency",
                    "difficulty": "Hard",
                    "question": "How does Speculative Decoding reduce time-per-token (TPT) latency in LLM generation, and when does it fail to provide speedups?",
                    "scenario": "Deploying an 70B parameter model with a 150ms per-token budget under high user traffic.",
                    "keyPointsToCover": [
                        "A draft model rapidly proposes K candidate tokens autoregressively",
                        "The target 70B model validates all K tokens in a single parallel forward pass",
                        "Verification uses rejection sampling to match target distribution identically",
                        "Speedup degrades when draft acceptance rate falls below threshold",
                    ],
                    "modelAnswer": "Speculative decoding uses a smaller, faster draft model (e.g., 7B) to autoregressively speculate K forward tokens. The larger target model (70B) then runs a single parallel forward pass to verify all K tokens simultaneously. Verified tokens matching the target model's probability distribution are accepted, while the first divergence restarts drafting. This yields 2x-3x speedups for predictable text (code, JSON), but speedup drops to ~1x or worse if draft acceptance rate falls below ~60% in open-ended creative domains.",
                    "followUpPrompt": "How does speculative decoding interact with beam search or high sampling temperature?",
                },
                {
                    "id": "q-7",
                    "category": "Guardrails & Safety",
                    "difficulty": "Medium",
                    "question": "How do you architect real-time hallucination detection and prompt-injection defense into an enterprise AI gateway?",
                    "scenario": "Customer-facing financial advisor copilot handling arbitrary user prompts and internal account DB access.",
                    "keyPointsToCover": [
                        "Dual-model boundary defense with intent classification and input sanitization",
                        "Constrained output decoders (JSON schema enforcement, logit bias masking)",
                        "Post-generation factual verification (NLI claim verification against retrieved context)",
                    ],
                    "modelAnswer": "An enterprise AI gateway implements three layered defensive barriers: 1) Ingress filtering: Fast BERT/RoBERTa classifiers inspect prompts for jailbreak tokens and delimiter escapes before LLM invocation. 2) Constrained decoding: Grammar-based generation (like Outlines or JSON schema grammar) restricts output tokens to valid syntax. 3) Egress verification: Natural Language Inference (NLI) models verify that claims in the output strictly entail from retrieved ground-truth documents, flagging hallucinated citations.",
                    "followUpPrompt": "How do you minimize latency overhead added by the NLI verification step?",
                },
                {
                    "id": "q-8",
                    "category": "Agentic Architecture",
                    "difficulty": "Hard",
                    "question": "Design a resilient multi-agent architecture capable of recovering from execution loops and tool call failures.",
                    "scenario": "Autonomous software engineering agent compiling, testing, and modifying backend microservices.",
                    "keyPointsToCover": [
                        "State machine transitions with bounded recursion and cycle detection",
                        "Reflection loops and self-critique with scratchpad memory isolation",
                        "Idempotent tool interfaces with transactional rollbacks",
                    ],
                    "modelAnswer": "A resilient multi-agent architecture uses a deterministic state machine rather than open-ended recursive loops. Cycles are prevented using state hashes and step-budget quotas. When a tool call errors, the error output is injected into a dedicated Reflection node rather than retrying blindly. All agent tool actions (like git commits or file edits) are staged into isolated sandbox workspaces with transactional rollback capability if tests fail.",
                    "followUpPrompt": "How do you prevent context window exhaustion during extended debugging sessions?",
                },
                {
                    "id": "q-9",
                    "category": "Model Quantization & Precision",
                    "difficulty": "Medium",
                    "question": "How does Post-Training Quantization (PTQ) compare with Quantization-Aware Training (QAT), and what are the tradeoffs of AWQ vs GPTQ for 4-bit weights?",
                    "scenario": "Deploying a 70B parameter model on a single 24GB VRAM GPU with minimal degradation in perplexity.",
                    "keyPointsToCover": [
                        "PTQ quantizes weights after training without gradient updates, risking accuracy drop on outliers",
                        "QAT simulates quantization errors during fine-tuning so weights adapt to discrete rounding",
                        "AWQ protects salient weight channels (activation-aware), while GPTQ minimizes second-order error via Hessian inverse",
                    ],
                    "modelAnswer": "Post-Training Quantization (PTQ) quantizes weights/activations directly from FP16 to INT8/INT4 without backpropagation, which is fast but susceptible to outlier activation distortion. QAT simulates lower-precision rounding during fine-tuning, preserving the highest accuracy. For 4-bit weight-only LLM serving, AWQ (Activation-aware Weight Quantization) identifies the top 1% salient weights based on activation magnitudes and protects them from clipping, outperforming uniform rounding. GPTQ uses an optimal brain compression approach computing inverse Hessian matrices to minimize output reconstruction error.",
                    "followUpPrompt": "How does activation quantization (W4A4 or W8A8) impact memory bandwidth vs compute-bound operations?",
                },
                {
                    "id": "q-10",
                    "category": "Fine-Tuning & Parameter Efficiency",
                    "difficulty": "Medium",
                    "question": "Explain the mathematical intuition behind Low-Rank Adaptation (LoRA) and QLoRA, and how rank (r) and alpha affect training stability.",
                    "scenario": "Fine-tuning a base foundational model on proprietary enterprise legal contracts with limited compute.",
                    "keyPointsToCover": [
                        "Weight update delta W is decomposed into low-rank matrices B * A where rank r << d",
                        "Freezes pre-trained base model weights, reducing trainable parameters by 99%+",
                        "QLoRA quantizes base weights to 4-bit NormalFloat (NF4) with Double Quantization and Paged Optimizers",
                    ],
                    "modelAnswer": "LoRA decomposes the high-dimensional weight update matrix delta W (dimension d x k) into two low-rank matrices B (d x r) and A (r x k) such that delta W = B * A, where rank r is small (e.g. 8 to 64). During forward pass, W_new = W_0 + (alpha / r) * (B * A) * x. Base weights W_0 remain frozen, drastically slashing optimizer memory state (Adam momentum/variance). QLoRA advances this by keeping base weights in 4-bit NormalFloat (NF4), using Double Quantization to compress quantization constants, and paging optimizer states across CPU/GPU memory during gradient spikes.",
                    "followUpPrompt": "How do you merge LoRA adapter weights back into base model checkpoints for zero-latency deployment?",
                },
                {
                    "id": "q-11",
                    "category": "Distributed Training & Parallelism",
                    "difficulty": "Hard",
                    "question": "How do Tensor Parallelism (Megatron-LM), Pipeline Parallelism, and ZeRO/FSDP distribute large model state across multi-GPU clusters?",
                    "scenario": "Training or fine-tuning a 405B parameter model across a cluster of 64 H100 GPU nodes.",
                    "keyPointsToCover": [
                        "Tensor Parallelism splits individual weight matrices (column/row parallel) within a single node via NVLink",
                        "Pipeline Parallelism partitions sequential layers across nodes with micro-batching (1F1B schedule)",
                        "ZeRO / FSDP shards optimizer states (ZeRO-1), gradients (ZeRO-2), and parameters (ZeRO-3) across data-parallel ranks",
                    ],
                    "modelAnswer": "3D Parallelism combines three orthogonal techniques: 1) Tensor Parallelism (TP) splits MLP and Self-Attention weight matrices column-wise and row-wise across GPUs within an NVLink boundary, requiring All-Reduce operations after each layer. 2) Pipeline Parallelism (PP) divides model layers sequentially across distinct nodes connected over InfiniBand, executing micro-batches in a 1F1B (one forward, one backward) schedule to reduce pipeline bubble idle time. 3) Fully Sharded Data Parallel (FSDP / ZeRO-3) eliminates redundant model state across data-parallel workers by sharding optimizer states, gradients, and model weights, gathering them on-demand via All-Gather during forward/backward passes and immediately freeing them.",
                    "followUpPrompt": "What causes pipeline bubbles in pipeline parallelism, and how do interleaved scheduling schemes reduce them?",
                },
                {
                    "id": "q-12",
                    "category": "AI Evaluation & Telemetry",
                    "difficulty": "Easy",
                    "question": "How do you design a robust offline evaluation suite and online telemetry pipeline for an enterprise LLM copilot?",
                    "scenario": "Evaluating code generation accuracy and safety before promoting a new model version to production.",
                    "keyPointsToCover": [
                        "Offline benchmarks: Golden test datasets, unit test pass rates (pass@k), and LLM-as-a-judge with rubric alignment",
                        "Online telemetry: Acceptance rate of suggestions, dwell time, user edits, latency p95/p99",
                        "Shadow deployments and canary routing for side-by-side comparison",
                    ],
                    "modelAnswer": "A rigorous evaluation framework separates offline pre-deployment validation from online telemetry. Offline evaluation uses deterministic unit test pass rates (e.g. pass@1 on synthetic and human-curated coding challenges), semantic similarity tests against golden test suites, and multi-model LLM-as-a-judge with strict scoring rubrics to catch regressions. Online telemetry captures implicit user feedback (acceptance rate of completions, undo rates, character retention), explicit feedback (thumbs up/down), and token generation latency. Canary rollouts route 5% traffic to candidate models to verify telemetry parity before 100% cutover.",
                    "followUpPrompt": "How do you detect and correct prompt drift or judge bias in LLM-as-a-judge pipelines?",
                },
                {
                    "id": "q-13",
                    "category": "Continuous Batching & Scheduling",
                    "difficulty": "Hard",
                    "question": "What is Continuous (Iteration-Level) Batching in LLM serving engines, and how does it outperform static request batching?",
                    "scenario": "Handling variable length input prompts (100 to 4,000 tokens) with unpredictable completion lengths.",
                    "keyPointsToCover": [
                        "Static batching waits for all requests in a batch to finish generating before returning, wasting GPU compute",
                        "Continuous batching schedules at the iteration (token) level: finished sequences exit immediately and new requests join",
                        "Chunked prefill prevents long prompt processing from stalling active token decoding",
                    ],
                    "modelAnswer": "In standard static batching, all requests in a batch must generate up to the longest sequence length, forcing shorter completed requests to idle while waiting, resulting in terrible GPU utilization. Continuous batching operates at the token-iteration level: after each forward pass, requests that emit an EOS token are evicted immediately, and new incoming requests are scheduled into the freed batch slots on the very next iteration. Coupled with chunked prefill, long prompt prefill computations are sliced across steps, preventing decoding starvation and boosting server throughput by 3-5x.",
                    "followUpPrompt": "How does continuous batching interact with priority queues when SLA deadlines are violated?",
                },
                {
                    "id": "q-14",
                    "category": "Semantic Caching & Cost Optimization",
                    "difficulty": "Easy",
                    "question": "How does Semantic Caching work for LLM API queries, and what threshold tuning is required to avoid serving irrelevant cached answers?",
                    "scenario": "A high-volume customer support chatbot receiving 100,000 repetitive inquiries per day.",
                    "keyPointsToCover": [
                        "Embedding user query into vector database and performing cosine similarity lookup",
                        "Score threshold calibration: too low causes hallucinated irrelevant answers; too high causes cache misses",
                        "Cache invalidation and tenant isolation rules",
                    ],
                    "modelAnswer": "Semantic caching stores past prompt embeddings and generated answers in a vector database. When a new prompt arrives, its embedding is compared against cached queries. If cosine similarity exceeds a strict threshold (e.g. 0.92-0.96), the cached answer is returned immediately, eliminating LLM latency and token costs. Calibration requires a balance: setting the threshold too low causes semantic false positives (e.g., confusing 'How to cancel subscription' with 'How to upgrade subscription'), while setting it too high defeats cache utility. In production, semantic cache entries are tagged with tenant IDs and TTLs to prevent security cross-contamination and stale answers.",
                    "followUpPrompt": "How do you handle personalized prompts containing dynamic variables (e.g. user names or order IDs) in a semantic cache?",
                },
                {
                    "id": "q-15",
                    "category": "Multimodal AI Architectures",
                    "difficulty": "Hard",
                    "question": "Architect an end-to-end multimodal processing pipeline that extracts insights from mixed documents (PDFs, tables, diagrams) with high spatial accuracy.",
                    "scenario": "Processing millions of architectural engineering blueprints and technical schematics.",
                    "keyPointsToCover": [
                        "Vision encoder (e.g. SigLIP / ViT) generating patch embeddings",
                        "Projector module (MLP or Perceiver Resampler) aligning visual features into LLM token space",
                        "Bounding-box coordinate prediction and high-resolution dynamic image tiling",
                    ],
                    "modelAnswer": "I would implement a vision-language architecture utilizing dynamic image tiling and a high-resolution vision encoder. The document page is partitioned into a grid of 448x448 image tiles plus a downscaled global overview thumbnail. Each tile passes through a SigLIP vision transformer to produce visual patch embeddings. A 2-layer MLP projector aligns these visual representations into the LLM's text token embedding dimension. The model is trained on bounding-box coordinate tokens ([ymin, xmin, ymax, xmax]) to localize tables, text blocks, and circuit components with spatial grounding before generating structured JSON outputs.",
                    "followUpPrompt": "How do you optimize memory consumption when feeding 16+ image tiles into a large context window?",
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
                {
                    "id": "q-4",
                    "category": "Networking & Protocols",
                    "difficulty": "Easy",
                    "question": "What is the head-of-line (HoL) blocking problem in HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC)?",
                    "scenario": "Web application performance optimization for high-latency mobile networks with packet loss.",
                    "keyPointsToCover": [
                        "HTTP/1.1 HoL occurs at the application level (one response per TCP connection at a time)",
                        "HTTP/2 multiplexes streams on one TCP connection, but suffers TCP-level HoL blocking on packet drop",
                        "HTTP/3 uses QUIC over UDP with independent stream loss recovery",
                    ],
                    "modelAnswer": "In HTTP/1.1, pipelining requires responses to arrive in exact request order, causing application-level HoL blocking. HTTP/2 introduces binary framing and stream multiplexing over a single TCP connection. However, if a single TCP packet drops, TCP retransmission blocks ALL multiplexed streams until that packet arrives. HTTP/3 resolves this using QUIC over UDP, providing true independent stream flow control where packet loss on stream A never blocks stream B.",
                    "followUpPrompt": "Why does HTTP/3 still experience connection setup overhead despite using UDP?",
                },
                {
                    "id": "q-5",
                    "category": "Caching & Concurrency",
                    "difficulty": "Medium",
                    "question": "How do you protect a distributed system from a Cache Stampede (Thundering Herd) when a hot cache key expires?",
                    "scenario": "A hot homepage cache key with 50,000 queries per second expires in Redis.",
                    "keyPointsToCover": [
                        "Mutually exclusive distributed locking (mutex) on cache miss",
                        "Probabilistic early expiration (XFetch algorithm)",
                        "Background asynchronous refreshing (stale-while-revalidate / SingleFlight pattern)",
                    ],
                    "modelAnswer": "When a hot key expires, thousands of concurrent threads simultaneously query the underlying database, overwhelming it. Three primary patterns mitigate this: 1) SingleFlight/Mutex: Only the first thread acquiring a distributed lock computes the database query while others await the result. 2) Stale-while-revalidate: Serve the slightly stale cached value while an async goroutine refreshes the cache. 3) Probabilistic early expiration (XFetch): Threads calculate a delta probability based on TTL and compute time, triggering early background refreshes before hard expiration.",
                    "followUpPrompt": "How do you handle worker crashes while holding the cache stampede mutex?",
                },
                {
                    "id": "q-6",
                    "category": "Database Architecture & Migrations",
                    "difficulty": "Hard",
                    "question": "How do you execute a zero-downtime schema migration on a 1-billion row PostgreSQL table that is receiving 5,000 writes/second?",
                    "scenario": "Renaming a critical column and splitting user address into a normalized table.",
                    "keyPointsToCover": [
                        "Expand and contract pattern across separate application deployments",
                        "Dual-writing via application code or database triggers",
                        "Backfilling historical data in small batched asynchronous chunks",
                        "Avoidance of table-locking DDL operations (using CONCURRENTLY for indexes)",
                    ],
                    "modelAnswer": "Zero-downtime migration follows the Expand/Contract (Parallel Run) pattern in 4 steps: 1) Expand: Add the new column/table with NULL constraints and create supporting indexes with CREATE INDEX CONCURRENTLY to avoid AccessExclusiveLocks. 2) Dual-Write: Deploy code that writes to both old and new schemas simultaneously. 3) Backfill: Run a background batch worker backfilling historical rows in small batches (e.g. 1000 rows with pauses) using indexed primary keys to avoid lock escalation. 4) Contract: Validate parity, switch read paths to new schema, remove legacy writes, and drop old columns asynchronously.",
                    "followUpPrompt": "What happens if a dual-write fails to the secondary table during step 2?",
                },
                {
                    "id": "q-7",
                    "category": "Messaging & Event Architecture",
                    "difficulty": "Medium",
                    "question": "How do you mitigate consumer lag and rebalance storms in a high-throughput Apache Kafka event pipeline?",
                    "scenario": "A payment consumer group with 128 partitions falls 2 hours behind during Black Friday.",
                    "keyPointsToCover": [
                        "CooperativeStickyAssignor to prevent stop-the-world partition rebalances",
                        "Decoupling network fetch thread from worker execution pool",
                        "Backpressure and consumer group lag metric monitoring",
                    ],
                    "modelAnswer": "Consumer lag is typically caused by slow downstream IO blocking the poll loop or frequent rebalances. Three key architectural solutions: 1) Cooperative Rebalancing: Migrate from the eager round-robin assignor to the CooperativeStickyAssignor, allowing unassigned partitions to continue processing during rebalancing without global pauses. 2) Asynchronous Worker Pool: Separate the single-threaded Kafka consumer poll loop from execution by dispatching records to an internal bounded thread pool keyed by partition key. 3) Tuning max.poll.interval.ms: Ensure long-running processing tasks do not exceed the heartbeat timeout, triggering false rebalances.",
                    "followUpPrompt": "How do you ensure strict in-order processing when dispatching to a concurrent worker pool?",
                },
                {
                    "id": "q-8",
                    "category": "Distributed Transactions",
                    "difficulty": "Hard",
                    "question": "Compare the Saga pattern (Orchestration vs Choreography) against Two-Phase Commit (2PC) for cross-service atomic transactions.",
                    "scenario": "Fulfilling an order spanning Inventory, Payment, and Shipping microservices.",
                    "keyPointsToCover": [
                        "2PC guarantees immediate consistency but suffers from blocking coordinator locks and latency spikes",
                        "Saga provides eventual consistency using compensating transactions",
                        "Choreography is decentralized via event bus; Orchestration centralizes state via workflow coordinator (Temporal)",
                    ],
                    "modelAnswer": "Two-Phase Commit (2PC) coordinates atomic prepare/commit phases with synchronous distributed locks. While strictly consistent, 2PC is fragile in microservices because a network partition or crashed participant holds row locks indefinitely, destroying availability. In contrast, the Saga pattern embraces eventual consistency. Each service executes its local transaction and publishes events. If a step fails, compensating transactions undo earlier actions. For complex multi-step workflows, Orchestrated Sagas (using state engines like Temporal) provide superior auditability and error visibility over decentralized choreographed event chains.",
                    "followUpPrompt": "How do you handle a compensating transaction failure during rollback?",
                },
                {
                    "id": "q-9",
                    "category": "Linux Systems & Memory Management",
                    "difficulty": "Medium",
                    "question": "How does the Linux Virtual Memory subsystem handle page faults, and what conditions trigger the Linux OOM Killer in containerized (cgroups v2) workloads?",
                    "scenario": "A high-throughput in-memory Go/Java microservice gets terminated with Exit Code 137 in Kubernetes.",
                    "keyPointsToCover": [
                        "Major vs minor page faults and translation lookaside buffer (TLB) misses",
                        "cgroup memory limits (memory.max, memory.high) and swap accounting",
                        "oom_score calculation and memory reclaim pressure on anonymous vs file-backed pages",
                    ],
                    "modelAnswer": "When a process references virtual memory not yet mapped to physical RAM, the MMU triggers a page fault. Minor page faults map an already allocated page in kernel page cache without disk IO, while major page faults require synchronous disk reads. In containerized environments governed by cgroups v2, the kernel enforces memory limits per container. When usage nears memory.max, the kernel first reclaims file-backed page caches. If anonymous dirty pages cannot be swapped or reclaimed, cgroup memory exhaustion triggers the OOM killer. The kernel computes oom_score (based on badness and oom_score_adj) and sends SIGKILL (exit code 137) to the offending process.",
                    "followUpPrompt": "How can setting memory.high in cgroups v2 provide graceful throttling before hard OOM termination?",
                },
                {
                    "id": "q-10",
                    "category": "Rate Limiting & Traffic Shaping",
                    "difficulty": "Easy",
                    "question": "Compare the Token Bucket, Leaky Bucket, and Sliding Window Counter rate-limiting algorithms for high-scale public API gateways.",
                    "scenario": "Enforcing 1,000 requests/minute per API key across 20 distributed gateway nodes.",
                    "keyPointsToCover": [
                        "Token bucket permits bursts up to capacity while refilling at a steady rate",
                        "Leaky bucket processes requests at a constant smooth egress rate",
                        "Sliding Window Counter in Redis using sorted sets (ZSET) vs atomic counters",
                    ],
                    "modelAnswer": "Token Bucket maintains a bucket of capacity B refilled at rate R tokens/sec. It allows bursty traffic up to bucket capacity while guaranteeing a long-term average rate. Leaky Bucket buffers incoming requests in a FIFO queue and emits them at an exact steady rate, smoothing spikes but introducing queuing latency. Sliding Window Counter divides time into micro-windows or uses Redis Sorted Sets (ZSET) where timestamps are keys and expired requests are pruned via ZREMRANGEBYSCORE. For high-throughput distributed systems, an approximation using two atomic counters (current window and previous window weight) achieves low memory overhead and O(1) time complexity.",
                    "followUpPrompt": "How do you prevent race conditions and multiple round-trips when checking rate limits in Redis?",
                },
                {
                    "id": "q-11",
                    "category": "Eventual Consistency & Conflict Resolution",
                    "difficulty": "Hard",
                    "question": "How do Conflict-Free Replicated Data Types (CRDTs) guarantee convergence in distributed peer-to-peer systems without a central coordinator?",
                    "scenario": "Building a collaborative offline-first document editor with real-time syncing across mobile and desktop clients.",
                    "keyPointsToCover": [
                        "State-based (CvRDT) vs Operation-based (CmRDT) CRDTs",
                        "Mathematical properties of semilattices: Commutativity, Associativity, Idempotency",
                        "Last-Write-Wins (LWW-Element-Set) vs RGA / Yjs tree structures for text sequences",
                    ],
                    "modelAnswer": "CRDTs ensure that multiple replicas of a data structure can update concurrently without coordination and are mathematically guaranteed to converge to the identical state once all operations are received. State-based CRDTs (CvRDTs) form a bounded join-semilattice where states are merged using a least upper bound function that satisfies three properties: Associativity, Commutativity, and Idempotency (A = A U A). For collaborative text editing, sequence CRDTs (like Fugue or Yjs/RGA) assign unique fractional positions and lamport timestamps to characters, ensuring deterministic reordering regardless of network packet delivery order.",
                    "followUpPrompt": "Why does Last-Write-Wins (LWW) risk silent data loss during concurrent clock skew?",
                },
                {
                    "id": "q-12",
                    "category": "Observability & SRE Reliability",
                    "difficulty": "Easy",
                    "question": "How do you define and implement Service Level Objectives (SLOs) and Error Budgets using Google's 4 Golden Signals?",
                    "scenario": "Transitioning a team from arbitrary alerts to an error-budget based release policy.",
                    "keyPointsToCover": [
                        "The 4 Golden Signals: Latency, Traffic, Errors, and Saturation",
                        "Service Level Indicator (SLI) formula: Good events / Total valid events",
                        "Error budget consumption rate (burn rate alerts) vs static thresholds",
                    ],
                    "modelAnswer": "Google SRE defines 4 Golden Signals: 1) Latency: Time taken to service requests (tracked via p50, p90, p99 percentiles). 2) Traffic: Demand placed on the service (QPS or network I/O). 3) Errors: Rate of failed requests (e.g., HTTP 5xx or unhandled exceptions). 4) Saturation: Fraction of constrained resource utilized (CPU, connection pool, memory). An SLI measures compliance as (Good Requests / Total Requests). An SLO sets a target (e.g. 99.9% over 30 days). The remaining 0.1% constitutes the Error Budget. Burn-rate alerts notify engineers when the budget is depleting faster than sustainable (e.g. 14.4x burn rate exhausts budget in 2 days), triggering feature freezes when exhausted.",
                    "followUpPrompt": "Why should latency SLOs be measured at the client or load balancer rather than internal application handlers?",
                },
                {
                    "id": "q-13",
                    "category": "Distributed Locking & Consensus",
                    "difficulty": "Medium",
                    "question": "Explain Martin Kleppmann's critique of the Redlock algorithm and why fencing tokens are essential for mutual exclusion.",
                    "scenario": "Distributed lock protecting a shared file storage export service against split-brain execution.",
                    "keyPointsToCover": [
                        "Redlock assumes synchronized clocks across independent Redis nodes",
                        "Clock drift, process pauses (GC / VM freeze), and network delays can violate lock safety",
                        "Fencing tokens (monotonically increasing numbers) validated at storage level",
                    ],
                    "modelAnswer": "Redlock attempts to build a distributed lock over N independent Redis nodes without consensus. Martin Kleppmann demonstrated that Redlock relies on dangerous timing assumptions: physical clock drift, long stop-the-world garbage collection pauses, or asynchronous network delay can cause a client's lock lease to expire without its knowledge. While client 1 is paused, client 2 acquires the lock. Client 1 then resumes and writes to storage, causing data corruption. To make distributed locking safe against pauses, the lock service must issue monotonically increasing Fencing Tokens. The storage resource must reject any write bearing a token lower than the highest token previously committed.",
                    "followUpPrompt": "Why is a consensus-backed system like etcd or ZooKeeper preferred over Redis for critical distributed locks?",
                },
                {
                    "id": "q-14",
                    "category": "Database Sharding & Data Partitioning",
                    "difficulty": "Hard",
                    "question": "How does Consistent Hashing with Virtual Nodes minimize data migration and prevent hot-spotting during dynamic cluster resizing?",
                    "scenario": "Scaling a distributed key-value cache cluster from 10 nodes to 15 nodes under peak load.",
                    "keyPointsToCover": [
                        "Modulo hashing problem: N % K forces almost 100% key remapping on node addition",
                        "Hash ring concept: Keys and nodes mapped onto a 2^32 or 2^64 integer ring",
                        "Virtual nodes (Vnodes) distribute uniform responsibility and avoid non-uniform clustering",
                    ],
                    "modelAnswer": "Traditional modulo hashing (hash(key) % N) causes catastrophic remapping: adding or removing a single node forces nearly all keys (K/N) to migrate to new servers. Consistent hashing maps both server IDs and data keys to positions on a 360-degree integer ring (0 to 2^32 - 1). A key is stored on the first node encountered clockwise. When adding node K+1, only keys between node K and K+1 are moved (on average K/N keys). To eliminate non-uniform data skew and hot spots, each physical machine is assigned hundreds of Virtual Nodes (Vnodes) scattered across the ring, ensuring even distribution and smooth load handover during failures.",
                    "followUpPrompt": "How do you coordinate key migration between nodes while continuing to serve live read/write traffic?",
                },
                {
                    "id": "q-15",
                    "category": "Microservices Resilience & Cascade Failures",
                    "difficulty": "Hard",
                    "question": "How do you architect Circuit Breakers, Bulkheads, and Retry Budgets to stop cascading failures across a distributed microservices graph?",
                    "scenario": "Downstream Recommendation Service degradation causing thread exhaustion in the upstream Checkout Service.",
                    "keyPointsToCover": [
                        "Circuit breaker states (Closed, Open, Half-Open) with rolling failure thresholds",
                        "Bulkhead isolation via separate thread pools or bounded semaphores",
                        "Exponential backoff with full jitter and retry budgets (e.g. max 10% retry traffic)",
                    ],
                    "modelAnswer": "In a microservices graph, a slow downstream dependency causes upstream callers to block waiting for sockets, exhausting application thread pools and crashing upstream services in a cascade. Resilience requires three defensive layers: 1) Circuit Breakers: Monitor error rates and timeout frequencies. When failures cross a threshold (e.g. 50% in 10s), the breaker trips to 'Open', failing fast immediately or serving cached fallback data without hitting the downstream service. After a cooldown, 'Half-Open' lets canary probes test recovery. 2) Bulkheads: Isolate worker thread pools or semaphore quotas per dependency so that an unresponsive recommendation engine cannot starve checkout threads. 3) Retry Budgets: Replace aggressive retries with exponential backoff and full jitter, capping retry attempts at no more than 10% of total outbound requests to prevent retry storms.",
                    "followUpPrompt": "Why can naive client-side retries amplify a partial outage into a total outage (retry storm)?",
                },
            ]

        # Dynamically synthesize questions if requested count exceeds curated bank
        while len(questions) < question_count:
            idx = len(questions) + 1
            diff = "Medium" if idx % 2 == 0 else "Hard"
            questions.append({
                "id": f"q-{idx}",
                "category": f"Advanced {focus.split(',')[0].strip() if focus else 'Architecture'}",
                "difficulty": diff,
                "question": f"How do you architect, operate, and troubleshoot {focus or role} systems under high scale and strict reliability constraints (Scenario {idx})?",
                "scenario": f"Production workload demanding high availability, telemetry monitoring, and automated failover for {role} at {company or 'scale'}.",
                "keyPointsToCover": [
                    "Failure domain isolation and service redundancy",
                    "Telemetry signals (latency, error budgets, p99)",
                    "Data consistency and recovery procedures",
                ],
                "modelAnswer": f"To address this {role} scenario, I would establish decoupled service boundaries, implement circuit breakers, enforce backpressure, and configure automated alerts for key operational invariants.",
                "followUpPrompt": "How would you test this failover mechanism in staging before promoting to production?",
            })

        # Ensure returned questions strictly match requested question_count
        if len(questions) > question_count:
            questions = questions[:question_count]

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
