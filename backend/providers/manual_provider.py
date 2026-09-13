"""
Manual topic provider for Almanac.
Loads and validates topics from a JSON catalog file.
"""

import json
from pathlib import Path
from typing import List, Optional, Union

from .base import Topic, TopicProvider


class ManualProvider(TopicProvider):
    """
    Provider that loads topics from a local JSON catalog (such as topics.json).
    Standardizes categories, formats tags, and provides fallback descriptions.
    """

    def __init__(self, topics_path: Optional[Union[str, Path]] = None):
        if topics_path is None:
            # Default to backend/scripts/topics.json relative to this file
            root_dir = Path(__file__).resolve().parents[2]
            self.topics_path = root_dir / "backend" / "scripts" / "topics.json"
        else:
            self.topics_path = Path(topics_path)

    @property
    def name(self) -> str:
        return "Manual Topic Catalog"

    def get_topics(self) -> List[Topic]:
        """
        Load topics from the JSON catalog and convert to Topic objects.
        """
        if not self.topics_path.exists():
            raise FileNotFoundError(f"Topics catalog not found at: {self.topics_path}")

        try:
            with open(self.topics_path, "r", encoding="utf-8") as f:
                raw_items = json.load(f)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Failed to parse topics JSON at {self.topics_path}: {exc}") from exc

        if not isinstance(raw_items, list):
            raise ValueError(f"Expected a JSON list in {self.topics_path}, got {type(raw_items).__name__}")

        topics: List[Topic] = []
        for idx, item in enumerate(raw_items):
            if not isinstance(item, dict):
                continue

            title = item.get("title", "").strip()
            if not title:
                continue

            category = item.get("category", "backend").strip().lower()
            description = item.get("description", "").strip()

            # Derive tags from category and title segments (e.g. "RAG - Architecture" -> ["rag", "architecture"])
            tags = item.get("tags")
            if not tags:
                derived_tags = [category]
                if " - " in title:
                    parts = [p.strip().lower().replace(" ", "-") for p in title.split(" - ")]
                    derived_tags.extend(parts)
                tags = list(dict.fromkeys(derived_tags))  # Preserve order, unique

            if not description:
                description = f"Comprehensive engineering guide to {title} covering architecture, implementation, and best practices."

            topics.append(
                Topic(
                    title=title,
                    category=category,
                    description=description,
                    source="manual",
                    source_url="",
                    tags=tags,
                    difficulty=item.get("difficulty", "Intermediate"),
                    raw_data=item,
                )
            )

        return topics
