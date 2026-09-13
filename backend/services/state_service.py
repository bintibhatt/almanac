"""
State management service for Almanac.
Tracks generated topics, skipped topics, failed generations, and execution metrics.
Persists state to shared/state.json.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from backend.providers.base import Topic


class StateService:
    """
    Manages persistent pipeline state in shared/state.json.
    Prevents duplicate work and maintains audit history of generations.
    """

    def __init__(self, state_file_path: Optional[Path] = None):
        if state_file_path is None:
            root_dir = Path(__file__).resolve().parents[2]
            self.state_file_path = root_dir / "shared" / "state.json"
        else:
            self.state_file_path = Path(state_file_path)

        self._state: Dict[str, Any] = self._load_state()

    def _load_state(self) -> Dict[str, Any]:
        """Load state from JSON file or initialize default structure if missing."""
        if not self.state_file_path.exists():
            return self._default_state()

        try:
            with open(self.state_file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if not isinstance(data, dict):
                    return self._default_state()
                return data
        except Exception:
            return self._default_state()

    def _default_state(self) -> Dict[str, Any]:
        return {
            "generated_topics": {},
            "skipped_topics": [],
            "failed_generations": [],
            "last_execution": None,
            "total_generated": 0,
        }

    def save(self):
        """Persist in-memory state to disk atomically."""
        self.state_file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.state_file_path, "w", encoding="utf-8") as f:
            json.dump(self._state, f, indent=2, ensure_ascii=False)

    def is_topic_generated(self, slug: str) -> bool:
        """Check if a topic slug has already been generated and saved."""
        return slug in self._state.get("generated_topics", {})

    def get_generated_topics(self) -> Dict[str, Dict[str, Any]]:
        """Return dict of all generated topics keyed by slug."""
        return self._state.get("generated_topics", {})

    def record_success(
        self,
        topic: Topic,
        metadata: Dict[str, Any],
        file_path: Optional[Path] = None,
    ):
        """Record a successful topic article generation."""
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        record = {
            "title": topic.title,
            "category": topic.category,
            "source": topic.source,
            "source_url": topic.source_url,
            "provider": metadata.get("provider", "unknown"),
            "model": metadata.get("model", "unknown"),
            "generated_at": metadata.get("generatedAt", now_iso),
            "file_path": str(file_path) if file_path else "",
            "status": "published",
        }

        self._state["generated_topics"][topic.slug] = record
        self._state["total_generated"] = len(self._state["generated_topics"])
        self._state["last_execution"] = {
            "status": "success",
            "topic": topic.title,
            "slug": topic.slug,
            "timestamp": now_iso,
        }
        self.save()

    def record_skip(self, topic: Topic, reason: str):
        """Record a topic that was skipped (e.g. duplicate)."""
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        entry = {
            "title": topic.title,
            "slug": topic.slug,
            "category": topic.category,
            "reason": reason,
            "timestamp": now_iso,
        }
        self._state.setdefault("skipped_topics", []).append(entry)
        self._state["last_execution"] = {
            "status": "skipped",
            "topic": topic.title,
            "slug": topic.slug,
            "reason": reason,
            "timestamp": now_iso,
        }
        self.save()

    def record_failure(self, topic: Topic, error: str):
        """Record a topic generation failure."""
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        entry = {
            "title": topic.title,
            "slug": topic.slug,
            "category": topic.category,
            "error": error,
            "timestamp": now_iso,
        }
        self._state.setdefault("failed_generations", []).append(entry)
        self._state["last_execution"] = {
            "status": "failed",
            "topic": topic.title,
            "slug": topic.slug,
            "error": error,
            "timestamp": now_iso,
        }
        self.save()

    def get_summary(self) -> Dict[str, Any]:
        """Return summary metrics of state."""
        return {
            "total_generated": len(self._state.get("generated_topics", {})),
            "total_skipped": len(self._state.get("skipped_topics", [])),
            "total_failed": len(self._state.get("failed_generations", [])),
            "last_execution": self._state.get("last_execution"),
        }
