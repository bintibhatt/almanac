"""
Context Retrieval and Grounding service for Almanac.
Retrieves relevant knowledge chunks from stored articles to enrich LLM prompts
and eliminate hallucinations during generation.
"""

from typing import List, Optional

from backend.providers.base import Topic
from backend.services.hybrid_search_service import HybridSearchService


class RetrievalService:
    """
    Retrieves supporting knowledge context for a topic prior to AI article generation.
    """

    def __init__(self, hybrid_search_service: Optional[HybridSearchService] = None):
        self.hybrid_search_service = hybrid_search_service or HybridSearchService()

    def retrieve_context(self, topic: Topic, max_chunks: int = 3) -> str:
        """
        Search vector index for related articles and format retrieved context.
        """
        query = f"{topic.title} {topic.description}"
        matches = self.hybrid_search_service.hybrid_search(
            query=query, top_k=max_chunks, category_filter=None
        )

        # Filter out self or non-matching low score results
        relevant = [m for m in matches if m["slug"] != topic.slug and m["hybrid_score"] > 0.5]
        if not relevant:
            return ""

        context_blocks: List[str] = []
        for idx, item in enumerate(relevant, 1):
            block = (
                f"[Context Reference #{idx}]: {item['title']} ({item['category']})\n"
                f"Description: {item.get('description', 'N/A')}\n"
                f"Tags: {', '.join(item.get('tags', []))}"
            )
            context_blocks.append(block)

        formatted_context = "\n\n".join(context_blocks)
        return (
            "--- RETRIEVED KNOWLEDGE CONTEXT (Use for grounding and reference citations) ---\n"
            f"{formatted_context}\n"
            "--- END RETRIEVED CONTEXT ---\n"
        )
