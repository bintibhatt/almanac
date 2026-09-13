"""
Topic service for Almanac.
Manages topic providers, querying, filtering, and selection.
"""

import random
from typing import Dict, List, Optional

from backend.providers.base import Topic, TopicProvider
from backend.providers.manual_provider import ManualProvider


class TopicService:
    """
    Central service for discovering, aggregating, and selecting topics.
    Decouples consumers from specific ingestion sources.
    """

    def __init__(self, default_provider: Optional[TopicProvider] = None):
        self._providers: Dict[str, TopicProvider] = {}
        primary = default_provider or ManualProvider()
        self.register_provider(primary)
        self._cached_topics: Optional[List[Topic]] = None

    def register_provider(self, provider: TopicProvider):
        """Register a new topic provider."""
        self._providers[provider.name] = provider
        self._cached_topics = None

    def get_all_topics(self, force_refresh: bool = False) -> List[Topic]:
        """
        Aggregate topics from all registered providers.
        """
        if self._cached_topics is not None and not force_refresh:
            return self._cached_topics

        aggregated: List[Topic] = []
        for provider in self._providers.values():
            try:
                topics = provider.get_topics()
                aggregated.extend(topics)
            except Exception as err:
                print(f"⚠️ Warning: Failed to fetch topics from provider '{provider.name}': {err}")

        self._cached_topics = aggregated
        return aggregated

    def get_topics_by_category(self, category: str) -> List[Topic]:
        """Filter topics by category."""
        target = category.strip().lower()
        return [t for t in self.get_all_topics() if t.category.lower() == target]

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
    ) -> Topic:
        """
        Select a specific topic by title, or a random topic (optionally filtered by category).
        """
        if title:
            found = self.get_topic_by_title(title)
            if found:
                return found
            # If not in catalog, construct an ad-hoc Topic
            return Topic(
                title=title,
                category=category or "backend",
                description=f"Deep-dive technical note on {title}.",
                source="ad-hoc",
            )

        candidates = self.get_topics_by_category(category) if category else self.get_all_topics()
        if not candidates:
            raise ValueError(f"No topics available" + (f" for category '{category}'" if category else ""))

        return random.choice(candidates)
