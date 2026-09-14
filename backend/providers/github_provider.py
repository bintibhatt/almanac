"""
GitHub Trending & Engineering Topic Provider for Almanac.
Ingests trending repositories and engineering topics from GitHub API.
"""

import json
from typing import Dict, List, Optional
import urllib.request
import urllib.parse

from .base import Topic, TopicProvider, slugify


class GitHubProvider(TopicProvider):
    """
    Topic provider that fetches trending repositories and technical topics from GitHub API.
    """

    DEFAULT_QUERIES = [
        "topic:system-design stars:>500",
        "topic:machine-learning stars:>1000",
        "topic:database stars:>500",
        "topic:devops stars:>500",
    ]

    def __init__(self, categories: Optional[List[str]] = None, timeout: int = 5):
        self.categories = categories or ["backend", "ai", "devops", "system-design", "databases"]
        self.timeout = timeout

    @property
    def name(self) -> str:
        return "GitHub Trending"

    def _fetch_from_github_api(self, query: str) -> List[Dict]:
        """Fetch repository data from GitHub Search API via HTTP GET."""
        encoded_query = urllib.parse.quote(query)
        url = f"https://api.github.com/search/repositories?q={encoded_query}&sort=stars&order=desc&per_page=5"
        headers = {
            "User-Agent": "Almanac-Engineering-Bot/1.0",
            "Accept": "application/vnd.github.v3+json",
        }

        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("items", [])

    def get_topics(self) -> List[Topic]:
        """
        Fetch topics from GitHub API or return curated fallback topics if offline.
        """
        topics: List[Topic] = []

        try:
            items = self._fetch_from_github_api("topic:system-design stars:>1000")
            for item in items:
                name = item.get("name", "").replace("-", " ").title()
                desc = item.get("description") or f"Popular GitHub repository {item.get('full_name')} covering engineering patterns."
                html_url = item.get("html_url", "")
                language = item.get("language") or "software-engineering"

                topics.append(
                    Topic(
                        title=f"{name} — Architecture & Patterns",
                        category="system-design",
                        description=desc,
                        source="github",
                        source_url=html_url,
                        tags=["github", language.lower(), "architecture"],
                        difficulty="Intermediate",
                        raw_data=item,
                    )
                )
        except Exception:
            # Fallback offline topics when GitHub API is unreachable or rate limited
            topics.extend([
                Topic(
                    title="Distributed Systems Consensus Protocols",
                    category="system-design",
                    description="Raft, Paxos, and Zab consensus mechanisms for distributed state machines.",
                    source="github",
                    source_url="https://github.com/topics/consensus",
                    tags=["github", "distributed-systems", "consensus"],
                    difficulty="Advanced",
                ),
                Topic(
                    title="eBPF Kernel Tracing & Observability",
                    category="devops",
                    description="Extended Berkeley Packet Filter for high-performance Linux kernel tracing and network security.",
                    source="github",
                    source_url="https://github.com/topics/ebpf",
                    tags=["github", "ebpf", "linux", "observability"],
                    difficulty="Advanced",
                ),
                Topic(
                    title="Vector Indexing Algorithms — HNSW & IVF",
                    category="ai",
                    description="Hierarchical Navigable Small World graphs and Inverted File Indexing for high-dimensional vector search.",
                    source="github",
                    source_url="https://github.com/topics/vector-search",
                    tags=["github", "vector-search", "hnsw", "ai"],
                    difficulty="Advanced",
                ),
            ])

        return topics
