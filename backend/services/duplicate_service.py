"""
Duplicate detection service for Almanac.
Prevents duplicate article generation via exact slug matching, title normalization,
and string similarity algorithms.
"""

from dataclasses import dataclass
from pathlib import Path
import re
from typing import Dict, List, Optional, Set

from backend.providers.base import Topic, slugify
from backend.services.state_service import StateService


def normalize_title(title: str) -> str:
    """
    Normalize title string for robust string comparison.
    Strips punctuation, converts to lower case, removes common stop words.
    """
    cleaned = title.lower().strip()
    cleaned = re.sub(r"[^\w\s]", " ", cleaned)
    words = cleaned.split()
    # Common technical stop words to ignore in strict duplicate title comparison
    stop_words = {"how", "what", "is", "a", "an", "the", "to", "in", "for", "of", "and", "with", "understanding", "guide"}
    meaningful = [w for w in words if w not in stop_words]
    return " ".join(meaningful) if meaningful else cleaned


def token_jaccard_similarity(text1: str, text2: str) -> float:
    """Calculate Jaccard word token similarity between two text strings."""
    tokens1 = set(re.findall(r"\w+", text1.lower()))
    tokens2 = set(re.findall(r"\w+", text2.lower()))

    if not tokens1 or not tokens2:
        return 0.0

    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    return len(intersection) / len(union)


@dataclass
class DuplicateResult:
    """Result of a duplicate topic check."""
    is_duplicate: bool
    reason: Optional[str] = None
    matched_slug: Optional[str] = None
    matched_title: Optional[str] = None
    similarity_score: float = 0.0


class DuplicateService:
    """
    Service that checks candidate topics against existing state and filesystem
    to prevent duplicate article generation.
    """

    def __init__(
        self,
        state_service: Optional[StateService] = None,
        knowledge_dir: Optional[Path] = None,
        similarity_threshold: float = 0.75,
    ):
        self.state_service = state_service or StateService()
        if knowledge_dir is None:
            root_dir = Path(__file__).resolve().parents[2]
            self.knowledge_dir = root_dir / "knowledge"
        else:
            self.knowledge_dir = Path(knowledge_dir)

        self.similarity_threshold = similarity_threshold

    def _get_existing_slugs_and_titles(self) -> Dict[str, str]:
        """
        Gather all existing article slugs and titles from both state and disk.
        Returns map of slug -> title.
        """
        existing: Dict[str, str] = {}

        # 1. Load from State Service
        generated = self.state_service.get_generated_topics()
        for slug, info in generated.items():
            existing[slug] = info.get("title", slug)

        # 2. Walk knowledge filesystem directory
        if self.knowledge_dir.exists():
            for md_file in self.knowledge_dir.rglob("*.md"):
                slug = md_file.stem
                if slug not in existing:
                    # Basic fallback title from slug
                    title_derived = slug.replace("-", " ").title()
                    existing[slug] = title_derived

        return existing

    def check_duplicate(self, topic: Topic) -> DuplicateResult:
        """
        Check whether a candidate topic is a duplicate of existing knowledge.
        """
        existing = self._get_existing_slugs_and_titles()

        # 1. Exact Slug Match
        candidate_slug = topic.slug
        if candidate_slug in existing:
            return DuplicateResult(
                is_duplicate=True,
                reason=f"Exact slug match ('{candidate_slug}') already exists.",
                matched_slug=candidate_slug,
                matched_title=existing[candidate_slug],
                similarity_score=1.0,
            )

        # 2. Normalized Title Match
        candidate_norm = normalize_title(topic.title)
        for existing_slug, existing_title in existing.items():
            existing_norm = normalize_title(existing_title)

            if candidate_norm == existing_norm:
                return DuplicateResult(
                    is_duplicate=True,
                    reason=f"Normalized title match with existing article '{existing_title}'.",
                    matched_slug=existing_slug,
                    matched_title=existing_title,
                    similarity_score=1.0,
                )

            # 3. Token Similarity Match
            score = token_jaccard_similarity(topic.title, existing_title)
            if score >= self.similarity_threshold:
                return DuplicateResult(
                    is_duplicate=True,
                    reason=f"High title similarity ({score:.2f}) with existing topic '{existing_title}'.",
                    matched_slug=existing_slug,
                    matched_title=existing_title,
                    similarity_score=score,
                )

        return DuplicateResult(is_duplicate=False)
