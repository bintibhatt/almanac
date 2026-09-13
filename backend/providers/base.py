"""
Base interfaces and data models for Almanac topic providers.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import re


def slugify(text: str) -> str:
    """Convert a title or text into a URL/filesystem friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text.strip("-")


@dataclass
class Topic:
    """
    Standardized data contract representing an engineering topic in Almanac.
    Decoupled from where the topic originated (manual JSON, GitHub, HN, RSS, etc.).
    """
    title: str
    category: str = "backend"
    description: str = ""
    source: str = "manual"
    source_url: str = ""
    tags: List[str] = field(default_factory=list)
    difficulty: str = "Intermediate"
    raw_data: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        # Normalize category
        self.category = self.category.strip().lower() if self.category else "backend"
        # Ensure title is stripped
        self.title = self.title.strip()
        # Ensure default tags include category and key terms if empty
        if not self.tags:
            self.tags = [self.category]

    @property
    def slug(self) -> str:
        """Return a URL-safe slug for this topic."""
        return slugify(self.title)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize topic to dictionary."""
        return {
            "title": self.title,
            "slug": self.slug,
            "category": self.category,
            "description": self.description,
            "source": self.source,
            "source_url": self.source_url,
            "tags": self.tags,
            "difficulty": self.difficulty,
            "raw_data": self.raw_data,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Topic":
        """Deserialize dictionary into a Topic instance."""
        return cls(
            title=data.get("title", "Untitled Topic"),
            category=data.get("category", "backend"),
            description=data.get("description", ""),
            source=data.get("source", "manual"),
            source_url=data.get("source_url", "") or data.get("sourceUrl", ""),
            tags=data.get("tags") or [],
            difficulty=data.get("difficulty", "Intermediate"),
            raw_data=data.get("raw_data") or {},
        )


class TopicProvider(ABC):
    """
    Abstract base class for all topic ingestion providers in Almanac.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable name of the topic provider."""
        pass

    @abstractmethod
    def get_topics(self) -> List[Topic]:
        """
        Fetch and return a standardized list of Topic objects.
        """
        pass
