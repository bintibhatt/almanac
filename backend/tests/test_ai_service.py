"""
Unit tests for AIService and AI providers.
"""

import unittest
from backend.ai.mock_provider import MockAIProvider
from backend.ai.service import AIService


class TestAIService(unittest.TestCase):

    def test_mock_provider(self):
        provider = MockAIProvider()
        self.assertEqual(provider.name, "mock")
        self.assertEqual(provider.default_model, "mock-engine-v1")

        output = provider.generate(prompt="Topic: Vector Databases", system_prompt="Be concise.")
        self.assertIn("## TL;DR", output)
        self.assertIn("## Architecture", output)
        self.assertIn("## Common Pitfalls", output)
        self.assertIn("## Interview Questions", output)
        self.assertIn("## Further Reading", output)
        # Verify no H1 is output
        self.assertFalse(output.strip().startswith("# Vector Databases"))

    def test_ai_service_mock_resolution(self):
        service = AIService(provider_name="mock")
        self.assertEqual(service.provider_name, "mock")
        self.assertEqual(service.active_model, "mock-engine-v1")

        text = service.generate(prompt="Topic: Event Loops")
        self.assertIn("## TL;DR", text)

    def test_ai_service_invalid_provider(self):
        with self.assertRaises(ValueError):
            service = AIService(provider_name="nonexistent_provider")
            _ = service.provider


if __name__ == "__main__":
    unittest.main()
