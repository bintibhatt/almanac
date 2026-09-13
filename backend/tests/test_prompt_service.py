"""
Unit tests for PromptService.
"""

import unittest
from backend.services.prompt_service import PromptService


class TestPromptService(unittest.TestCase):

    def test_prompt_service_templates_exist(self):
        service = PromptService()
        system_prompt = service.get_system_prompt()
        self.assertGreater(len(system_prompt), 0)
        self.assertIn("Almanac", system_prompt)

        article_prompt = service.get_article_prompt(
            title="Distributed Consensus",
            category="system-design",
            description="Raft and Paxos overview.",
            tags=["consensus", "raft"],
        )
        self.assertIn("Distributed Consensus", article_prompt)
        self.assertIn("system-design", article_prompt)
        self.assertIn("## TL;DR", article_prompt)
        self.assertIn("## Architecture", article_prompt)
        self.assertIn("## Interview Questions", article_prompt)


if __name__ == "__main__":
    unittest.main()
