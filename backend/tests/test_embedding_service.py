"""
Unit tests for EmbeddingService.
"""

import unittest

from backend.services.embedding_service import EmbeddingService, _cosine_similarity


class TestEmbeddingService(unittest.TestCase):

    def setUp(self):
        self.service = EmbeddingService(use_local_fallback=True)

    def test_vector_generation(self):
        vec = self.service.embed_text("Docker Containerization Overview")
        self.assertIsInstance(vec, list)
        self.assertEqual(len(vec), 384)

    def test_empty_text(self):
        vec = self.service.embed_text("")
        self.assertEqual(len(vec), 384)
        self.assertEqual(sum(vec), 0.0)

    def test_cosine_similarity(self):
        vec1 = [1.0, 0.0, 0.0]
        vec2 = [1.0, 0.0, 0.0]
        vec3 = [0.0, 1.0, 0.0]

        self.assertAlmostEqual(_cosine_similarity(vec1, vec2), 1.0)
        self.assertAlmostEqual(_cosine_similarity(vec1, vec3), 0.0)

    def test_semantic_similarity_relative_scoring(self):
        text1 = "REST API Architecture"
        text2 = "RESTful Web API Design"
        text3 = "Gardening Flowers Soil"

        vec1 = self.service.embed_text(text1)
        vec2 = self.service.embed_text(text2)
        vec3 = self.service.embed_text(text3)

        sim_api = self.service.calculate_similarity(vec1, vec2)
        sim_unrelated = self.service.calculate_similarity(vec1, vec3)

        self.assertGreater(sim_api, sim_unrelated)


if __name__ == "__main__":
    unittest.main()
