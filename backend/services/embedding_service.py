"""
Embedding service for Almanac.
Generates dense vector embeddings for technical text and calculates cosine similarity.
Supports sentence-transformers with a lightweight fallback vectorizer.
"""

import math

from typing import List, Optional

import re


def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine similarity between two float vectors."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm_a = math.sqrt(sum(a * a for a in vec1))
    norm_b = math.sqrt(sum(b * b for b in vec2))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    return dot_product / (norm_a * norm_b)


class FallbackVectorizer:
    """
    Lightweight, deterministic feature vectorizer generating 384-dim dense vectors.
    Serves as an offline fallback when sentence-transformers model is not loaded.
    """

    DIMENSION = 384

    def encode(self, text: str) -> List[float]:
        cleaned = text.lower().strip()
        tokens = re.findall(r"\w+", cleaned)
        if not tokens:
            return [0.0] * self.DIMENSION

        vec = [0.0] * self.DIMENSION
        for idx, token in enumerate(tokens):
            # Positional hash dispersion across dimensions
            token_hash = hash(token) % self.DIMENSION
            pos_weight = 1.0 / (1.0 + 0.1 * idx)
            vec[token_hash] += pos_weight

        # L2 normalize vector
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [v / norm for v in vec]

        return vec


class EmbeddingService:
    """
    Service responsible for vector embedding generation and semantic math.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2", use_local_fallback: bool = False):
        self.model_name = model_name
        self._model = None
        self._fallback_vectorizer = FallbackVectorizer()

        if not use_local_fallback:
            try:
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer(model_name)
            except Exception:
                # Graceful fallback to deterministic vectorizer if sentence-transformers is missing
                self._model = None

    @property
    def vector_dimension(self) -> int:
        return FallbackVectorizer.DIMENSION

    def embed_text(self, text: str) -> List[float]:
        """
        Generate a dense float vector representation for the given text.
        """
        if not text or not text.strip():
            return [0.0] * self.vector_dimension

        if self._model is not None:
            try:
                embedding = self._model.encode(text, convert_to_numpy=True)
                return embedding.tolist()
            except Exception:
                pass

        return self._fallback_vectorizer.encode(text)

    def embed_query(self, query: str) -> List[float]:
        """Generate embedding vector for a search query."""
        return self.embed_text(query)

    def calculate_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vector embeddings."""
        return _cosine_similarity(vec1, vec2)
