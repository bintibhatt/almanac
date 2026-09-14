"""
Topic Intelligence and AI Ranking service for Almanac.
Filters duplicates and ranks candidate topics across providers based on engineering
importance, novelty, domain depth, and learning value.
"""

from dataclasses import dataclass, field
import re
from typing import Dict, List, Optional

from backend.ai.service import AIService
from backend.providers.base import Topic
from backend.services.duplicate_service import DuplicateService


@dataclass
class RankedTopic:
    """Dataclass holding a candidate topic alongside its intelligence score and evaluation reasoning."""
    topic: Topic
    score: float
    rank: int = 0
    reasoning: str = ""
    is_duplicate: bool = False


class TopicIntelligenceService:
    """
    Evaluates and ranks candidate topics from multiple ingestion providers.
    """

    HIGH_VALUE_DOMAINS = {
        "system-design": 25.0,
        "ai": 25.0,
        "databases": 20.0,
        "devops": 20.0,
        "security": 20.0,
        "backend": 15.0,
    }

    TECHNICAL_KEYWORDS = [
        "architecture", "consensus", "distributed", "isolation", "vector", "cache",
        "performance", "concurrency", "security", "optimization", "rag", "ebpf", "postgres",
    ]

    def __init__(
        self,
        duplicate_service: Optional[DuplicateService] = None,
        ai_service: Optional[AIService] = None,
    ):
        self.duplicate_service = duplicate_service or DuplicateService()
        self.ai_service = ai_service

    def evaluate_topic(self, topic: Topic) -> RankedTopic:
        """
        Evaluate a single candidate topic and return a RankedTopic container.
        """
        # 1. Check for duplicates
        dup_result = self.duplicate_service.check_duplicate(topic)
        if dup_result.is_duplicate:
            return RankedTopic(
                topic=topic,
                score=0.0,
                reasoning=f"Duplicate: {dup_result.reason}",
                is_duplicate=True,
            )

        # 2. Base Category Score
        cat_score = self.HIGH_VALUE_DOMAINS.get(topic.category.lower(), 10.0)

        # 3. Technical Depth / Keyword Density Score
        combined_text = f"{topic.title} {topic.description} {' '.join(topic.tags)}".lower()
        matched_kw = sum(1 for kw in self.TECHNICAL_KEYWORDS if kw in combined_text)
        depth_score = min(25.0, matched_kw * 5.0)

        # 4. Source Novelty Bonus
        source_bonus = 20.0 if topic.source in ("github", "hackernews") else 10.0

        # 5. Difficulty Bonus
        diff_bonus = {"Advanced": 20.0, "Intermediate": 15.0, "Beginner": 10.0}.get(topic.difficulty, 10.0)

        total_score = min(100.0, cat_score + depth_score + source_bonus + diff_bonus)
        reasoning = (
            f"Category ({cat_score:.1f}pts) + Depth ({depth_score:.1f}pts) + "
            f"Source '{topic.source}' ({source_bonus:.1f}pts) + Difficulty ({diff_bonus:.1f}pts)"
        )

        return RankedTopic(
            topic=topic,
            score=round(total_score, 1),
            reasoning=reasoning,
            is_duplicate=False,
        )

    def rank_topics(
        self,
        topics: List[Topic],
        top_k: int = 10,
        filter_duplicates: bool = True,
    ) -> List[RankedTopic]:
        """
        Evaluate, filter, and rank candidate topics across providers.
        """
        ranked_list: List[RankedTopic] = []

        for t in topics:
            ranked = self.evaluate_topic(t)
            if filter_duplicates and ranked.is_duplicate:
                continue
            ranked_list.append(ranked)

        # Sort descending by intelligence score
        ranked_list.sort(key=lambda r: r.score, reverse=True)

        # Assign ordinal ranks
        for idx, item in enumerate(ranked_list, 1):
            item.rank = idx

        return ranked_list[:top_k]
