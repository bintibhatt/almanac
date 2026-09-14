"""
Hybrid Search Service for Almanac.
Combines keyword search (BM25 / TF term matching) with dense vector similarity search
using Reciprocal Rank Fusion (RRF) for state-of-the-art retrieval performance.
"""

import re
from typing import Any, Dict, List, Optional

from backend.services.vector_store_service import VectorStoreService


class HybridSearchService:
    """
    Combines sparse keyword scoring and dense vector retrieval using Reciprocal Rank Fusion.
    """

    def __init__(self, vector_store_service: Optional[VectorStoreService] = None, rrf_k: float = 60.0):
        self.vector_store_service = vector_store_service or VectorStoreService()
        self.rrf_k = rrf_k

    def _keyword_search(self, query: str, category_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Perform keyword term frequency matching across indexed articles.
        """
        index = self.vector_store_service._index
        if not index or not query.strip():
            return []

        query_terms = set(re.findall(r"\w+", query.lower()))
        if not query_terms:
            return []

        target_cat = category_filter.strip().lower() if category_filter else None
        matches: List[Dict[str, Any]] = []

        for slug, entry in index.items():
            if target_cat and entry.get("category", "").lower() != target_cat:
                continue

            title = entry.get("title", "").lower()
            category = entry.get("category", "").lower()
            tags = " ".join(entry.get("tags", [])).lower()
            description = entry.get("description", "").lower()

            haystack = f"{title} {category} {tags} {description}"
            words = set(re.findall(r"\w+", haystack))

            overlap = query_terms.intersection(words)
            if not overlap:
                continue

            # Calculate term frequency score
            score = 0.0
            for term in query_terms:
                if term in title:
                    score += 5.0
                if term in tags:
                    score += 3.0
                if term in description:
                    score += 2.0
                if term in category:
                    score += 2.0

            matches.append({
                "slug": slug,
                "title": entry.get("title", slug),
                "category": entry.get("category", ""),
                "description": entry.get("description", ""),
                "tags": entry.get("tags", []),
                "kw_score": score,
            })

        matches.sort(key=lambda x: x["kw_score"], reverse=True)
        return matches

    def hybrid_search(
        self,
        query: str,
        top_k: int = 5,
        category_filter: Optional[str] = None,
        vector_weight: float = 0.5,
        keyword_weight: float = 0.5,
    ) -> List[Dict[str, Any]]:
        """
        Execute Hybrid Search combining keyword ranks and vector similarity ranks via RRF.
        """
        if not query.strip():
            return []

        # 1. Fetch Keyword Matches
        kw_results = self._keyword_search(query, category_filter=category_filter)

        # 2. Fetch Vector Matches
        vec_results = self.vector_store_service.search_similar(
            query=query, top_k=50, category_filter=category_filter
        )

        # Build rank maps
        kw_rank_map = {item["slug"]: idx for idx, item in enumerate(kw_results, 1)}
        vec_rank_map = {item["slug"]: idx for idx, item in enumerate(vec_results, 1)}

        # All unique candidate slugs
        all_slugs = set(kw_rank_map.keys()).union(set(vec_rank_map.keys()))
        if not all_slugs:
            return []

        merged: List[Dict[str, Any]] = []

        for slug in all_slugs:
            # Metadata lookup from entries
            meta = next(
                (item for item in kw_results + vec_results if item["slug"] == slug),
                None,
            )
            if not meta:
                continue

            # Calculate RRF Score
            kw_rank = kw_rank_map.get(slug)
            vec_rank = vec_rank_map.get(slug)

            rrf_score = 0.0
            if kw_rank is not None:
                rrf_score += keyword_weight * (1.0 / (self.rrf_k + kw_rank))
            if vec_rank is not None:
                rrf_score += vector_weight * (1.0 / (self.rrf_k + vec_rank))

            merged.append({
                "slug": slug,
                "title": meta.get("title", slug),
                "category": meta.get("category", ""),
                "description": meta.get("description", ""),
                "tags": meta.get("tags", []),
                "hybrid_score": round(rrf_score * 100, 4),
                "kw_rank": kw_rank,
                "vec_rank": vec_rank,
            })

        merged.sort(key=lambda x: x["hybrid_score"], reverse=True)
        return merged[:top_k]
