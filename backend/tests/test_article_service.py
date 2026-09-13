"""
Unit tests for ArticleService end-to-end article generation.
"""

from pathlib import Path
import tempfile
import unittest

from backend.ai.service import AIService
from backend.providers.base import Topic
from backend.services.article_service import (
    ArticleService,
    calculate_reading_time,
    clean_generated_markdown,
)
from backend.services.prompt_service import PromptService


class TestArticleService(unittest.TestCase):

    def test_calculate_reading_time(self):
        short_text = "word " * 100
        self.assertEqual(calculate_reading_time(short_text), "1 min read")
        long_text = "word " * 500
        self.assertEqual(calculate_reading_time(long_text), "3 min read")

    def test_clean_generated_markdown_removes_h1_and_fences(self):
        raw_with_h1 = "# Accidental Title\n\n## TL;DR\nActual summary"
        cleaned = clean_generated_markdown(raw_with_h1)
        self.assertTrue(cleaned.startswith("## TL;DR"))
        self.assertNotIn("# Accidental Title", cleaned)

        fenced = "```markdown\n## TL;DR\nActual summary\n```"
        cleaned_fenced = clean_generated_markdown(fenced)
        self.assertTrue(cleaned_fenced.startswith("## TL;DR"))
        self.assertFalse(cleaned_fenced.endswith("```"))

    def test_article_service_produce_and_save(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            knowledge_dir = Path(tmpdir)
            ai_service = AIService(provider_name="mock")
            prompt_service = PromptService()
            article_service = ArticleService(
                ai_service=ai_service,
                prompt_service=prompt_service,
                knowledge_dir=knowledge_dir,
            )

            topic = Topic(
                title="Consistent Hashing",
                category="system-design",
                description="Distributed hashing algorithm.",
                tags=["hashing", "distributed-systems"],
            )

            file_path, metadata = article_service.produce_and_save(topic)

            self.assertTrue(file_path.exists())
            self.assertEqual(file_path.name, "consistent-hashing.md")
            self.assertEqual(metadata["title"], "Consistent Hashing")
            self.assertEqual(metadata["category"], "system-design")
            self.assertEqual(metadata["provider"], "mock")

            content = file_path.read_text(encoding="utf-8")
            self.assertIn('title: "Consistent Hashing"', content)
            self.assertIn('category: "system-design"', content)
            self.assertIn("## TL;DR", content)
            self.assertIn("## Problem", content)
            self.assertIn("## Core Concept", content)
            self.assertIn("## Architecture", content)
            self.assertIn("## Example", content)
            self.assertIn("## Common Pitfalls", content)
            self.assertIn("## Interview Questions", content)
            self.assertIn("## Further Reading", content)


if __name__ == "__main__":
    unittest.main()
