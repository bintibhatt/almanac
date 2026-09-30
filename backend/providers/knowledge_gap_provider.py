"""
Knowledge Gap Provider for Almanac.
Inspects existing knowledge base and state history to identify underrepresented
engineering domains and propose high-value topics to fill coverage gaps.
"""

from pathlib import Path
from typing import Dict, List, Optional
import json

from .base import Topic, TopicProvider


class KnowledgeGapProvider(TopicProvider):
    """
    Topic provider that analyzes current knowledge coverage in shared/state.json
    and proposes topics for domains with low coverage.
    """

    CORE_DOMAINS = {
        "backend": [
            ("LSM-Tree vs B-Tree Storage Engines", "Deep-dive into write amplification, compaction, and read performance in databases like RocksDB vs Postgres."),
            ("Zero-Copy Networking with sendfile and io_uring", "Linux kernel zero-copy data transfer mechanics, socket buffers, and high-performance server architectures."),
            ("Distributed Tracing with OpenTelemetry and W3C TraceContext", "Trace context propagation, span hierarchies, head vs tail sampling, and performance overhead in microservices."),
        ],
        "system-design": [
            ("Consistent Hashing with Virtual Nodes", "Consistent hashing ring design, virtual node distribution, and partition rebalancing under node failure."),
            ("Raft Consensus Algorithm Internals", "Leader election, log replication, safety invariants, and joint consensus cluster membership changes."),
            ("Event-Driven Architecture with Outbox Pattern and Debezium", "Dual-write problem mitigation, transactional outbox pattern, change data capture (CDC), and Kafka streaming."),
        ],
        "ai": [
            ("Vector Quantization Techniques in Embedding Indexes", "Scalar quantization (SQ8), product quantization (PQ), and HNSW graph navigation tradeoffs at scale."),
            ("Speculative Decoding in Large Language Model Inference", "Draft model generation, target model verification, latency reduction, and GPU memory bandwidth dynamics."),
            ("Context Compression and Semantic Chunking for RAG", "Dynamic boundary detection, hierarchical token compression, and relevance reranking for grounded generation."),
        ],
        "devops": [
            ("eBPF Programmable Kernel Networking & Observability", "eBPF bytecode verification, XDP packet filtering, and kernel telemetry without context switches."),
            ("GitOps Reconciler Architecture in ArgoCD and Flux", "Kubernetes custom resource definitions, desired state reconciliation loops, and drift correction."),
            ("Service Mesh Mutual TLS (mTLS) with SPIFFE/SPIRE", "Cryptographic workload identity verification, automated certificate rotation, and Envoy sidecar proxies."),
        ],
        "security": [
            ("OAuth 2.1 & OpenID Connect PKCE Flow Architecture", "Proof Key for Code Exchange (PKCE), authorization code exchange, token replay mitigation, and JWT verification."),
            ("Row-Level Security (RLS) in Multi-Tenant PostgreSQL", "PostgreSQL RLS policies, tenant isolation barriers, query planner overhead, and security bypass vectors."),
            ("Cryptographic Nonces and Replay Attack Prevention", "Stateless replay defense, timestamp windows, sliding bloom filters, and distributed Redis nonce caches."),
        ],
    }

    def __init__(self, state_file_path: Optional[Path] = None):
        if state_file_path is None:
            root_dir = Path(__file__).resolve().parents[2]
            self.state_file_path = root_dir / "shared" / "state.json"
        else:
            self.state_file_path = Path(state_file_path)

    @property
    def name(self) -> str:
        return "Knowledge Gap Discovery"

    def _get_category_counts(self) -> Dict[str, int]:
        """Analyze existing generated notes per category."""
        counts = {cat: 0 for cat in self.CORE_DOMAINS}
        if not self.state_file_path.exists():
            return counts

        try:
            with open(self.state_file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                generated = data.get("generated_topics", {})
                for item in generated.values():
                    cat = item.get("category", "").lower().strip()
                    if cat in counts:
                        counts[cat] += 1
                    else:
                        counts[cat] = 1
        except Exception:
            pass

        return counts

    def get_topics(self) -> List[Topic]:
        """
        Identify domains with fewest articles and propose topics to fill gaps.
        """
        counts = self._get_category_counts()
        # Sort domains by lowest note count first
        sorted_domains = sorted(self.CORE_DOMAINS.keys(), key=lambda d: counts.get(d, 0))

        topics: List[Topic] = []
        for domain in sorted_domains:
            proposals = self.CORE_DOMAINS.get(domain, [])
            for title, desc in proposals:
                topics.append(
                    Topic(
                        title=title,
                        category=domain,
                        description=desc,
                        source="knowledge-gap",
                        source_url="",
                        tags=[domain, "gap-analysis", "architecture"],
                        difficulty="Advanced",
                    )
                )

        return topics
