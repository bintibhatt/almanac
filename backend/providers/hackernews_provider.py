"""
Hacker News Topic Ingestion Provider for Almanac.
Fetches top engineering discussions and technology articles from Hacker News API.
"""

import json
from typing import Dict, List, Optional
import urllib.request

from .base import Topic, TopicProvider, slugify


class HackerNewsProvider(TopicProvider):
    """
    Topic provider that ingests top technology stories from Hacker News.
    """

    API_TOP_STORIES = "https://hacker-news.firebaseio.com/v0/topstories.json"
    API_ITEM = "https://hacker-news.firebaseio.com/v0/item/{item_id}.json"

    TECHNICAL_KEYWORDS = [
        "architecture", "system", "database", "python", "rust", "go", "ai", "llm",
        "vector", "api", "linux", "kernel", "distributed", "security", "performance",
        "redis", "postgres", "kafka", "docker", "kubernetes", "network", "compiler",
    ]

    def __init__(self, limit: int = 15, timeout: int = 4):
        self.limit = limit
        self.timeout = timeout

    @property
    def name(self) -> str:
        return "Hacker News"

    def _is_technical_title(self, title: str) -> bool:
        """Check if story title contains engineering or system keywords."""
        cleaned = title.lower()
        return any(kw in cleaned for kw in self.TECHNICAL_KEYWORDS)

    def _determine_category(self, title: str) -> str:
        """Determine category from title keywords."""
        title_lower = title.lower()
        if any(k in title_lower for k in ["ai", "llm", "vector", "gpt", "model", "prompt"]):
            return "ai"
        if any(k in title_lower for k in ["docker", "kubernetes", "linux", "kernel", "devops", "cloud", "aws"]):
            return "devops"
        if any(k in title_lower for k in ["postgres", "database", "sql", "redis", "mongo"]):
            return "databases"
        if any(k in title_lower for k in ["security", "auth", "oauth", "jwt", "encrypt", "hack"]):
            return "security"
        if any(k in title_lower for k in ["system", "architecture", "distributed", "scale", "load balancer"]):
            return "system-design"
        return "backend"

    def get_topics(self) -> List[Topic]:
        """
        Fetch top tech stories from Hacker News API or return fallback topics if offline.
        """
        topics: List[Topic] = []

        try:
            req = urllib.request.Request(self.API_TOP_STORIES, headers={"User-Agent": "Almanac-Bot/1.0"})
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                story_ids = json.loads(resp.read().decode("utf-8"))[:self.limit]

            for sid in story_ids:
                try:
                    item_url = self.API_ITEM.format(item_id=sid)
                    item_req = urllib.request.Request(item_url, headers={"User-Agent": "Almanac-Bot/1.0"})
                    with urllib.request.urlopen(item_req, timeout=self.timeout) as item_resp:
                        story = json.loads(item_resp.read().decode("utf-8"))

                    title = story.get("title", "").strip()
                    if title and self._is_technical_title(title):
                        category = self._determine_category(title)
                        url = story.get("url") or f"https://news.ycombinator.com/item?id={sid}"

                        topics.append(
                            Topic(
                                title=title,
                                category=category,
                                description=f"Top Hacker News engineering discussion: {title}.",
                                source="hackernews",
                                source_url=url,
                                tags=["hackernews", category],
                                difficulty="Intermediate",
                                raw_data=story,
                            )
                        )
                except Exception:
                    continue
        except Exception:
            pass

        # Fallback offline topics if API is unreachable or returns insufficient technical matches
        if not topics:
            topics.extend([
                Topic(
                    title="Zero-Downtime Database Schema Migrations",
                    category="databases",
                    description="Patterns for executing online schema migrations in high-throughput PostgreSQL databases.",
                    source="hackernews",
                    source_url="https://news.ycombinator.com",
                    tags=["hackernews", "postgres", "databases", "migrations"],
                    difficulty="Advanced",
                ),
                Topic(
                    title="Understanding Linux Cgroups v2 Resource Limits",
                    category="devops",
                    description="Deep dive into control groups v2 memory, CPU, and IO isolation mechanism in modern Linux kernels.",
                    source="hackernews",
                    source_url="https://news.ycombinator.com",
                    tags=["hackernews", "linux", "cgroups", "devops"],
                    difficulty="Intermediate",
                ),
            ])

        return topics
