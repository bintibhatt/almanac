"""
Topic Intelligence and AI Ranking service for Almanac.
Filters duplicates and ranks candidate topics across providers based on engineering
importance, novelty, domain depth, and learning value.
"""

from dataclasses import dataclass, field
import re
from typing import Any, Dict, List, Optional

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
        "storage", "kernel", "io_uring", "raft", "sharding", "zero-copy", "lsm", "runtime",
    ]

    def __init__(
        self,
        duplicate_service: Optional[DuplicateService] = None,
        ai_service: Optional[AIService] = None,
        state_service: Optional[Any] = None,
    ):
        self.duplicate_service = duplicate_service or DuplicateService()
        self.ai_service = ai_service
        self.state_service = state_service or getattr(self.duplicate_service, "state_service", None)

    def evaluate_topic(self, topic: Topic) -> RankedTopic:
        """
        Evaluate a single candidate topic and return a RankedTopic container.
        Incorporates freshness, relevance, source quality, category diversity, and knowledge gaps.
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
        cat_score = self.HIGH_VALUE_DOMAINS.get(topic.category.lower(), 12.0)

        # 3. Technical Depth / Keyword Density Score
        combined_text = f"{topic.title} {topic.description} {' '.join(topic.tags)}".lower()
        matched_kw = sum(1 for kw in self.TECHNICAL_KEYWORDS if kw in combined_text)
        depth_score = min(25.0, matched_kw * 4.0)

        # 4. Source Quality & Priority
        source_key = (topic.source or "").lower().strip()
        if source_key in ("user-request", "user_request", "ad-hoc"):
            source_bonus = 30.0  # User-requested topics have highest priority
        elif source_key in ("knowledge-gap", "knowledge_gap"):
            source_bonus = 22.0  # Filling gaps in knowledge library
        elif source_key in ("github", "hackernews"):
            source_bonus = 20.0  # Live external trending
        else:
            source_bonus = 10.0  # Static catalog

        # 5. Difficulty Bonus
        diff_bonus = {"Advanced": 20.0, "Intermediate": 15.0, "Beginner": 10.0}.get(topic.difficulty, 12.0)

        # 6. Category Diversity & Gap Bonus
        diversity_score = 0.0
        if self.state_service:
            try:
                generated = self.state_service.get_generated_topics()
                cat_count = sum(1 for item in generated.values() if item.get("category", "").lower() == topic.category.lower())
                # Bonus for underrepresented domains
                if cat_count == 0:
                    diversity_score += 15.0
                elif cat_count <= 2:
                    diversity_score += 8.0

                # Penalty if the immediately preceding generation was this exact category
                last_exec = getattr(self.state_service, "_state", {}).get("last_execution")
                if last_exec and last_exec.get("status") == "success":
                    last_slug = last_exec.get("slug")
                    last_topic = generated.get(last_slug, {})
                    if last_topic.get("category", "").lower() == topic.category.lower():
                        diversity_score -= 8.0
            except Exception:
                pass

        total_score = min(100.0, max(5.0, cat_score + depth_score + source_bonus + diff_bonus + diversity_score))
        reasoning = (
            f"Category ({cat_score:.1f}pts) + Depth ({depth_score:.1f}pts) + "
            f"Source '{topic.source}' ({source_bonus:.1f}pts) + Difficulty ({diff_bonus:.1f}pts) + "
            f"Diversity ({diversity_score:+.1f}pts)"
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
