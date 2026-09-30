"""
Topic service for Almanac.
Manages topic providers, querying, filtering, and selection across manual and live external sources.
"""

import random
from typing import Any, Dict, List, Optional

from backend.providers.base import Topic, TopicProvider
from backend.providers.github_provider import GitHubProvider
from backend.providers.hackernews_provider import HackerNewsProvider
from backend.providers.knowledge_gap_provider import KnowledgeGapProvider
from backend.providers.manual_provider import ManualProvider
from backend.providers.user_request_provider import UserRequestProvider


class TopicService:
    """
    Central service for discovering, aggregating, and selecting topics.
    Decouples consumers from specific ingestion sources.
    """

    def __init__(self, include_live_providers: bool = True):
        self._providers: Dict[str, TopicProvider] = {}
        # Core & gap discovery providers
        self.register_provider(UserRequestProvider())
        self.register_provider(KnowledgeGapProvider())
        self.register_provider(ManualProvider())

        if include_live_providers:
            self.register_provider(GitHubProvider())
            self.register_provider(HackerNewsProvider())

        self._cached_topics: Optional[List[Topic]] = None

    def register_provider(self, provider: TopicProvider):
        """Register a new topic provider."""
        self._providers[provider.name] = provider
        self._cached_topics = None

    def get_all_topics(self, force_refresh: bool = False, source_filter: Optional[str] = None) -> List[Topic]:
        """
        Aggregate topics from registered providers, optionally filtered by source.
        """
        if self._cached_topics is None or force_refresh:
            aggregated: List[Topic] = []
            for provider in self._providers.values():
                try:
                    topics = provider.get_topics()
                    aggregated.extend(topics)
                except Exception as err:
                    print(f"⚠️ Warning: Failed to fetch topics from provider '{provider.name}': {err}")
            self._cached_topics = aggregated

        all_topics = self._cached_topics or []
        if source_filter and source_filter.strip().lower() != "all":
            sf = source_filter.strip().lower()
            return [t for t in all_topics if t.source.lower() == sf or sf in t.source.lower()]

        return all_topics

    def get_topics_by_category(self, category: str, source_filter: Optional[str] = None) -> List[Topic]:
        """Filter topics by category and optional source."""
        target = category.strip().lower()
        candidates = self.get_all_topics(source_filter=source_filter)
        return [t for t in candidates if t.category.lower() == target]

    def get_topic_by_title(self, title: str) -> Optional[Topic]:
        """Find a topic with an exact or case-insensitive title match."""
        target = title.strip().lower()
        for topic in self.get_all_topics():
            if topic.title.lower() == target:
                return topic
        return None

    def select_topic(
        self,
        category: Optional[str] = None,
        title: Optional[str] = None,
        source: Optional[str] = None,
        intelligence_service: Optional[Any] = None,
    ) -> Topic:
        """
        Intelligently select a topic using Topic Intelligence scoring and duplicate filtering.
        Avoids random selection and prioritizes freshness, engineering depth, user requests,
        and knowledge gaps.
        """
        if title:
            found = self.get_topic_by_title(title)
            if found:
                return found
            return Topic(
                title=title,
                category=category or "backend",
                description=f"Deep-dive technical note on {title}.",
                source="user-request",
            )

        candidates = (
            self.get_topics_by_category(category, source_filter=source)
            if category
            else self.get_all_topics(source_filter=source)
        )

        if not candidates:
            raise ValueError(f"No candidate topics available" + (f" for category '{category}'" if category else ""))

        # Lazy initialize intelligence service if not passed
        if intelligence_service is None:
            from backend.services.topic_intelligence import TopicIntelligenceService
            intelligence_service = TopicIntelligenceService()

        # Score and rank candidate topics across providers
        ranked = intelligence_service.rank_topics(candidates, top_k=5, filter_duplicates=True)
        if ranked:
            return ranked[0].topic

        # If all candidates were filtered as duplicates, select from fresh knowledge gap proposals
        gap_provider = KnowledgeGapProvider()
        gap_topics = gap_provider.get_topics()
        if category:
            gap_topics = [t for t in gap_topics if t.category.lower() == category.lower()]

        gap_ranked = intelligence_service.rank_topics(gap_topics, top_k=1, filter_duplicates=True)
        if gap_ranked:
            return gap_ranked[0].topic

        # Final resilient non-empty fallback
        return candidates[0]
