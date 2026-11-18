---
title: "When AI Knows More Than It Can Offer"
description: "Top Hacker News engineering discussion: When AI Knows More Than It Can Offer."
slug: "when-ai-knows-more-than-it-can-offer"
category: "ai"
tags:
  - "hackernews"
  - "ai"
difficulty: "Intermediate"
readingTime: "10 min read"
published: "2026-11-18"
updated: "2026-11-18"
source: "hackernews"
sourceUrl: "https://medium.com/@smoking2man/when-ai-knows-more-than-it-can-offer-how-training-turns-an-intelligent-assistant-into-a-generator-7e700f05163e"
provider: "gemini"
model: "gemini-2.5-flash"
generatedAt: "2026-11-18T15:31:22Z"
version: "1.0"
---

## TL;DR
"When AI knows more than it can offer" describes the **epistemic-authorization gap** in production AI systems: the delta between what a model can infer from parametric weights, shared retrieval indices, or tool outputs, and what it is legally, securely, or deterministically permitted to expose to a given caller. Closing this gap requires replacing probabilistic prompt-level refusals with structural **Policy Enforcement Points (PEPs)** across retrieval, tool-schema projection, and egress validation. Systems that enforce these boundaries deterministically eliminate cross-tenant data leaks, confused-deputy tool executions, and ungrounded capability promises under adversarial load.

## Problem
Modern LLM-backed applications routinely aggregate heterogeneous data sources—multi-tenant vector stores, internal SQL warehouses, observability logs, and third-party APIs—into a unified inference context. Without explicit structural isolation, the model acquires far broader visibility and capability than the requesting user holds:

- **Cross-Tenant RAG Leakage:** Retrieving top-$k$ embeddings globally and asking the LLM to "only answer using documents for `tenant_id=X`" fails under indirect prompt injection or summarization requests, leaking PII and secrets across boundaries.
- **Confused Deputy Execution:** Binding privileged tool schemas (e.g., `refund_payment`, `query_admin_db`) to an agent allows unprivileged callers to manipulate natural language arguments and trigger unauthorized state mutations—a failure mode mirrored in AI-generated applications that expose private user records when row-level authorization is omitted.
- **Parametric Over-Sharing & Unfulfillable Offers:** Foundation models memorize training corpora and infer unverified capabilities (e.g., promising unsupported SLA actions or outputting memorized credentials), creating compliance exposure (GDPR/HIPAA) and silent semantic corruption.

Naive mitigation via system prompts (`"Never reveal confidential data"`) treats a deterministic security boundary as a probabilistic token-prediction problem, leaving systems vulnerable to extraction attacks and latency degradation from bloated contexts.

## Core Concept
Managing an AI system that knows more than it can offer rests on separating three distinct scopes at runtime:

1. **Epistemic Scope ($E$):** Everything the model can derive from parametric weights plus retrieved in-context data.
2. **Authorization Scope ($A$):** The strict subset of records, attributes, and state mutations permitted for the authenticated `Principal` under Attribute-Based Access Control (ABAC).
3. **Offerable Scope ($O$):** The intersection $E \cap A$ constrained further by output safety invariants (DLP rules, confidence thresholds, and deterministic SLA capabilities).

Three architectural invariants govern this boundary:
- **Complete Mediation:** Every context chunk and tool invocation must pass through a deterministic authorization check *before* entering the model's context window or executing downstream.
- **Zero-Trust Context Projection:** An LLM must never receive tokens it is forbidden to repeat. If a fact must not be offered, it must not enter the prompt.
- **Fail-Closed Egress:** Because parametric weights cannot be partitioned per user, egress filtering must treat all raw model generations as untrusted strings subject to deterministic inspection before reaching the client.

## How It Works
Enforcing $O \subseteq (E \cap A)$ executes across a four-stage deterministic pipeline:

1. **Ingress & Principal Resolution:** The gateway verifies cryptographic identity (JWT/mTLS), resolves tenant ID, roles, clearance attributes, and allowed tool capabilities into an immutable `Principal` context.
2. **Pre-Retrieval Pushdown & Context Pruning:** Before vector similarity or lexical search runs, the retrieval layer injects mandatory metadata predicates (e.g., `tenant_id == principal.tenant AND classification <= principal.clearance`) directly into the index query plan.
3. **Dynamic Capability Projection:** The orchestrator intersects the system's full tool registry with `principal.scopes`. Unauthorized tool schemas are stripped entirely from the LLM request payload so the model cannot hallucinate or attempt restricted calls.
4. **Constrained Inference & Egress Inspection:** The model executes within the pruned context. Before streaming or returning to the caller, an egress inspector runs deterministic PII/secret detectors and policy assertions, failing closed on violations.

```
[Client Request + Auth Token]
             |
             v
+-----------------------------+
|  Ingress & Principal Auth   | ---> Resolves Principal(tenant, roles, clearance)
+-----------------------------+
             |
     +-------+-----------------------+
     |                               |
     v                               v
+---------------------------+  +---------------------------+
| Pre-Retrieval ABAC Filter |  | Capability Projection     |
| (Index-level predicates)  |  | (Prune tool JSON schemas) |
+---------------------------+  +---------------------------+
     |                               |
     +---------------+---------------+
                     |
                     v
        +-------------------------+
        |   Stateless LLM Engine  | (Sees ONLY authorized tokens & tools)
        +-------------------------+
                     |
                     v
        +-------------------------+
        | Egress Policy & DLP Gate| ---> Redacts/Blocks parametric leaks
        +-------------------------+
                     |
                     v
           [Verified Response]
```

**Resource Mechanics:** Pre-retrieval filtering reduces context-window token count and KV-cache memory pressure, lowering Time-To-First-Token (TTFT) and inference compute cost compared to post-retrieval filtering. However, index-level ABAC increases vector search latency if high-cardinality metadata predicates degrade HNSW graph traversal efficiency (requiring pre-filtered partition indices or hybrid inverted indexes).

## Architecture
In a production microservices topology, the **AI Policy Enforcement Point (PEP)** sits directly behind the API Gateway and wraps both the Model Gateway and Retrieval Fabric:

- **Upstream Interactions:** Receives authenticated requests with propagated trace IDs and signed identity claims. Rejects unauthenticated or malformed principal contexts immediately (HTTP 401/403) before incurring GPU inference costs.
- **Downstream Storage & Caches:**
  - *Vector & Document Stores:* Enforces tenant-partitioned namespaces or mandatory row-level security (RLS) predicates.
  - *Semantic Cache:* Keyed strictly by `(embedding_hash, policy_epoch, permission_fingerprint)`. Never shares cached completions across disparate authorization scopes.
  - *Tool Runners:* Re-validates the `Principal` token independently at the execution microservice (defense in depth against LLM argument tampering).
- **Failure Domains & Scaling:** PEP and DLP stages run as stateless CPU-bound sidecars or gateway workers, scaling horizontally independently of GPU inference pools. Policy evaluation failures (e.g., unreachable OPA/policy store) must fail closed—aborting retrieval and inference rather than defaulting to open context.

## Example
The following Python 3.11+ implementation demonstrates a production-grade `AuthorizedInferencePipeline` enforcing pre-retrieval ABAC filtering, dynamic tool capability projection, fail-closed policy checks, and deterministic egress DLP redaction.

```python
from __future__ import annotations

import asyncio
import hashlib
import logging
import re
from dataclasses import dataclass, field
from enum import IntEnum
from typing import Any, Callable, Coroutine

logger = logging.getLogger("ai.pep")


class Clearance(IntEnum):
    PUBLIC = 0
    INTERNAL = 1
    CONFIDENTIAL = 2
    RESTRICTED = 3


class AuthorizationError(Exception):
    """Raised when policy enforcement fails closed."""


@dataclass(frozen=True, slots=True)
class Principal:
    user_id: str
    tenant_id: str
    clearance: Clearance
    allowed_tools: frozenset[str]

    def policy_fingerprint(self) -> str:
        # Used to isolate semantic caches across authorization boundaries
        raw = f"{self.tenant_id}:{self.clearance.value}:{sorted(self.allowed_tools)}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


@dataclass(frozen=True, slots=True)
class DocumentChunk:
    doc_id: str
    tenant_id: str
    classification: Clearance
    content: str


@dataclass(frozen=True, slots=True)
class ToolSpec:
    name: str
    required_clearance: Clearance
    description: str
    handler: Callable[[Principal, dict[str, Any]], Coroutine[Any, Any, str]]


class EgressSanitizer:
    """Deterministic post-inference guard against parametric secret leakage."""

    _PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
        ("SSN", re.compile(r"\b\d{3}-\d{2}-\d{4}\b")),
        ("API_KEY", re.compile(r"\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{16,}\b")),
        ("BEARER", re.compile(r"Bearer\s+[A-Za-z0-9\-._~+/]+=*", re.IGNORECASE)),
    )

    @classmethod
    def sanitize(cls, text: str, clearance: Clearance) -> str:
        if clearance >= Clearance.RESTRICTED:
            return text
        sanitized = text
        for label, pattern in cls._PATTERNS:
            if pattern.search(sanitized):
                logger.warning("Egress DLP triggered redaction", extra={"rule": label})
                sanitized = pattern.sub(f"[REDACTED_{label}]", sanitized)
        return sanitized


class AuthorizedInferencePipeline:
    def __init__(
        self,
        vector_index: list[DocumentChunk],
        tool_registry: dict[str, ToolSpec],
        llm_call: Callable[[str, list[str]], Coroutine[Any, Any, str]],
    ) -> None:
        self._index = vector_index
        self._tools = tool_registry
        self._llm_call = llm_call
        self._semantic_cache: dict[tuple[str, str], str] = {}

    def _retrieve_authorized(
        self, query: str, principal: Principal, top_k: int = 3
    ) -> list[DocumentChunk]:
        # Pre-retrieval pushdown: enforce tenant and clearance BEFORE ranking/context entry
        authorized_pool = [
            chunk
            for chunk in self._index
            if chunk.tenant_id == principal.tenant_id
            and chunk.classification <= principal.clearance
        ]
        # Simple lexical overlap ranking for demonstration; production uses filtered ANN
        query_terms = set(query.lower().split())
        ranked = sorted(
            authorized_pool,
            key=lambda c: len(query_terms & set(c.content.lower().split())),
            reverse=True,
        )
        return ranked[:top_k]

    def _project_tools(self, principal: Principal) -> list[str]:
        # Strip unauthorized schemas so the LLM cannot offer or invoke hidden capabilities
        return [
            name
            for name, spec in self._tools.items()
            if name in principal.allowed_tools
            and principal.clearance >= spec.required_clearance
        ]

    async def execute_tool(
        self, principal: Principal, tool_name: str, args: dict[str, Any]
    ) -> str:
        # Defense-in-depth: re-verify authorization at tool boundary (prevents confused deputy)
        spec = self._tools.get(tool_name)
        if spec is None:
            raise AuthorizationError(f"Unknown tool: {tool_name}")
        if tool_name not in principal.allowed_tools:
            raise AuthorizationError(f"Principal {principal.user_id} lacks scope for {tool_name}")
        if principal.clearance < spec.required_clearance:
            raise AuthorizationError("Insufficient clearance for tool execution")
        return await spec.handler(principal, args)

    async def query(self, principal: Principal, user_query: str) -> str:
        if not principal.tenant_id:
            raise AuthorizationError("Missing tenant_id; failing closed")

        cache_key = (
            hashlib.sha256(user_query.strip().encode("utf-8")).hexdigest(),
            principal.policy_fingerprint(),
        )
        if cached := self._semantic_cache.get(cache_key):
            return cached

        chunks = self._retrieve_authorized(user_query, principal)
        visible_tools = self._project_tools(principal)

        context_block = "\n".join(f"[{c.doc_id}] {c.content}" for c in chunks)
        prompt = (
            f"Context:\n{context_block or 'NONE'}\n\n"
            f"Available Tools: {visible_tools}\n"
            f"Question: {user_query}"
        )

        try:
            raw_output = await asyncio.wait_for(
                self._llm_call(prompt, visible_tools), timeout=10.0
            )
        except TimeoutError as exc:
            logger.error("Inference timed out", extra={"tenant": principal.tenant_id})
            raise RuntimeError("Upstream inference timeout") from exc

        safe_output = EgressSanitizer.sanitize(raw_output, principal.clearance)
        self._semantic_cache[cache_key] = safe_output
        return safe_output
```

## Common Pitfalls
- **Post-Retrieval Filtering:** Fetching top-$k$ global chunks and discarding unauthorized ones afterward causes "empty context" failures (if all top-$k$ belong to another tenant) and leaks statistical existence via latency or missing-answer patterns. *Mitigation:* Push ABAC predicates into the index query planner or use physically partitioned tenant indices.
- **Unscoped Semantic Caching:** Keying caches solely on normalized prompt embeddings lets User B receive cached completions synthesized from User A's confidential context. *Mitigation:* Include a cryptographic `policy_fingerprint` (tenant, roles, policy version) in every cache key.
- **Prompt-Based Access Control:** Instructing the LLM to "withhold fields X and Y unless the user is an admin" invites jailbreaks and indirect prompt injection via retrieved text. *Mitigation:* Redact or omit restricted fields deterministically prior to tokenization.
- **Privileged Agent Service Accounts:** Running tool connectors under a single global admin credential turns the LLM into a confused deputy when it passes user-influenced parameters to downstream APIs. *Mitigation:* Propagate the caller's OAuth/JWT token (`on-behalf-of` flow) and enforce authorization inside the downstream service.

## Interview Questions
1. **Why is post-generation filtering insufficient to secure a multi-tenant RAG system?**
   *Model Answer:* Once restricted tokens enter the context window, the model can synthesize derived facts, encode data indirectly (via formatting, acrostics, or side-channel signals), or be tricked via indirect prompt injection into bypassing simple output regexes. Moreover, post-filtering wastes context budget and compute. Complete mediation requires pre-retrieval filtering at the index layer so restricted tokens never enter the prompt.

2. **How do you balance HNSW vector search recall with strict row-level ABAC predicates?**
   *Model Answer:* Applying selective metadata filters *after* HNSW graph traversal collapses recall when the authorized subset is small; applying them *during* traversal can disconnect graph hops. Production systems solve this via hybrid architectures: partitioning indices by coarse-grained attributes (`tenant_id`), using inline bitset-filtered HNSW traversal with dynamic `efSearch` expansion, or falling back to exact brute-force SIMD scan when the authorized candidate cardinality drops below a threshold (e.g., $<10\text{k}$ vectors).

3. **An AI agent can read public Jira tickets and invoke an internal `deploy_service` tool. How can it be compromised, and how do you architect the fix?**
   *Model Answer:* It is vulnerable to **indirect prompt injection**: an attacker embeds malicious instructions inside a public Jira ticket, which the agent reads and interprets as commands to invoke `deploy_service`. Fixes include: (1) stripping write-capable tool schemas during untrusted-content summarization, (2) requiring deterministic human-in-the-loop (HITL) cryptographic confirmation for state-mutating tools, and (3) validating tool arguments against strict schemas and caller permissions outside the LLM.

## Further Reading
- **OWASP Top 10 for Large Language Model Applications** (OWASP Foundation) — Specifically *LLM02: Sensitive Information Disclosure* and *LLM06: Excessive Agency*.
- **Greshake, K., et al. (2023)** — *"Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection"* (arXiv:2302.12173).
- **Carlini, N., et al. (2021)** — *"Extracting Training Data from Large Language Models"* (USENIX Security Symposium), detailing parametric memorization risks.
- **Saltzer, J. H., & Schroeder, M. D. (1975)** — *"The Protection of Information in Computer Systems"* (Proceedings of the IEEE), establishing *Least Privilege* and *Complete Mediation*.
