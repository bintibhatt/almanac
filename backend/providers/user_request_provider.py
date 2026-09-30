"""
User Request Topic Provider for Almanac.
Reads user-submitted topic requests from shared/requested_topics.json.
Provides high-priority candidate topics from manual user learning requests.
"""

from pathlib import Path
from typing import Dict, List, Optional
import json

from .base import Topic, TopicProvider


class UserRequestProvider(TopicProvider):
    """
    Topic provider that ingests topics requested manually by users.
    """

    def __init__(self, requests_file_path: Optional[Path] = None):
        if requests_file_path is None:
            root_dir = Path(__file__).resolve().parents[2]
            self.requests_file_path = root_dir / "shared" / "requested_topics.json"
        else:
            self.requests_file_path = Path(requests_file_path)

    @property
    def name(self) -> str:
        return "User Learning Requests"

    def get_topics(self) -> List[Topic]:
        """Load pending user-requested topics from disk."""
        if not self.requests_file_path.exists():
            return []

        try:
            with open(self.requests_file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if not isinstance(data, list):
                    return []
        except Exception:
            return []

        topics: List[Topic] = []
        for item in data:
            if not isinstance(item, dict):
                continue
            title = item.get("title", "").strip()
            if not title:
                continue

            category = item.get("category", "backend").strip().lower()
            description = item.get("description", "").strip() or f"User-requested deep-dive technical note on {title}."
            topics.append(
                Topic(
                    title=title,
                    category=category,
                    description=description,
                    source="user-request",
                    source_url="",
                    tags=item.get("tags") or [category, "user-requested"],
                    difficulty=item.get("difficulty", "Intermediate"),
                    raw_data=item,
                )
            )

        return topics

    def add_request(
        self,
        title: str,
        category: str = "backend",
        description: str = "",
        difficulty: str = "Intermediate",
    ) -> bool:
        """Add a new user topic request."""
        try:
            items = []
            if self.requests_file_path.exists():
                try:
                    with open(self.requests_file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if isinstance(data, list):
                            items = data
                except Exception:
                    items = []

            items.append({
                "title": title.strip(),
                "category": category.strip().lower(),
                "description": description.strip(),
                "difficulty": difficulty,
            })
            self.requests_file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.requests_file_path, "w", encoding="utf-8") as f:
                json.dump(items, f, indent=2)
            return True
        except Exception:
            return False
