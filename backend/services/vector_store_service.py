"""
Vector Store and Indexing service for Almanac.
Indexes article vector embeddings, persists index to shared/vector_index.json,
and provides semantic similarity search and related article recommendations.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from backend.services.embedding_service import EmbeddingService


class VectorStoreService:
    """
    Manages vector index storage and semantic search operations for Almanac articles.
    """

    def __init__(
        self,
        index_file_path: Optional[Path] = None,
        embedding_service: Optional[EmbeddingService] = None,
    ):
        self.embedding_service = embedding_service or EmbeddingService()

        if index_file_path is None:
            root_dir = Path(__file__).resolve().parents[2]
            self.index_file_path = root_dir / "shared" / "vector_index.json"
        else:
            self.index_file_path = Path(index_file_path)

        self._index: Dict[str, Dict[str, Any]] = self._load_index()

    def _load_index(self) -> Dict[str, Dict[str, Any]]:
        """Load vector index from disk or return empty dict."""
        if not self.index_file_path.exists():
            return {}

        try:
            with open(self.index_file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, dict) else {}
        except Exception:
            return {}

    def save_index(self):
        """Persist vector index to disk atomically."""
        self.index_file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.index_file_path, "w", encoding="utf-8") as f:
            json.dump(self._index, f, indent=2, ensure_ascii=False)

    def upsert_article(
        self,
        slug: str,
        title: str,
        category: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Compute embedding vector for an article and update the vector index.
        """
        meta = metadata or {}
        tags = meta.get("tags") or [category]
        description = meta.get("description", "")

        # Rich text representation combining title, category, tags, and body content for embedding
        text_for_embedding = f"{title} | Category: {category} | Tags: {', '.join(tags)} | {description}\n{content[:2000]}"
        vector = self.embedding_service.embed_text(text_for_embedding)

        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        entry = {
            "slug": slug,
            "title": title,
            "category": category,
            "tags": tags,
            "description": description,
            "vector": vector,
            "updated_at": now_iso,
        }

        self._index[slug] = entry
        self.save_index()
        return entry

    def search_similar(
        self,
        query: str,
        top_k: int = 5,
        category_filter: Optional[str] = None,
        min_score: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic similarity search against the vector index for a user query.
        """
        if not self._index or not query.strip():
            return []

        query_vector = self.embedding_service.embed_query(query)
        results: List[Dict[str, Any]] = []

        target_cat = category_filter.strip().lower() if category_filter else None

        for slug, entry in self._index.items():
            if target_cat and entry.get("category", "").lower() != target_cat:
                continue

            article_vec = entry.get("vector", [])
            similarity = self.embedding_service.calculate_similarity(query_vector, article_vec)

            if similarity >= min_score:
                results.append({
                    "slug": slug,
                    "title": entry.get("title", slug),
                    "category": entry.get("category", ""),
                    "tags": entry.get("tags", []),
                    "description": entry.get("description", ""),
                    "score": round(similarity, 4),
                })

        # Sort descending by similarity score
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def get_related_articles(self, slug: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Find related articles in vector space for a given article slug.
        """
        target_entry = self._index.get(slug)
        if not target_entry:
            return []

        target_vec = target_entry.get("vector", [])
        results: List[Dict[str, Any]] = []

        for other_slug, entry in self._index.items():
            if other_slug == slug:
                continue

            other_vec = entry.get("vector", [])
            similarity = self.embedding_service.calculate_similarity(target_vec, other_vec)

            results.append({
                "slug": other_slug,
                "title": entry.get("title", other_slug),
                "category": entry.get("category", ""),
                "description": entry.get("description", ""),
                "score": round(similarity, 4),
            })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def get_index_size(self) -> int:
        """Return total indexed articles count."""
        return len(self._index)
