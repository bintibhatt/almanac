"""
Unit tests for ValidationService.
"""

import unittest

from backend.services.validation_service import ValidationService


class TestValidationService(unittest.TestCase):

    def setUp(self):
        self.validator = ValidationService(min_word_count=20)
        self.valid_metadata = {
            "title": "Test Title",
            "slug": "test-title",
            "category": "backend",
            "tags": ["test"],
            "difficulty": "Intermediate",
            "readingTime": "1 min read",
            "published": "2026-09-12",
            "source": "manual",
            "provider": "mock",
            "model": "mock-v1",
        }

    def test_valid_article(self):
        content = """## TL;DR
This is a summary of the article.

## Core Concept
Here is how the core concept works in detail with plenty of explanation text.

## How It Works
The execution flow is straightforward and structured.

## Example
```python
def example():
    return True
```
"""
        result = self.validator.validate(content, self.valid_metadata)
        self.assertTrue(result.is_valid)
        self.assertEqual(len(result.errors), 0)

    def test_empty_content(self):
        result = self.validator.validate("", self.valid_metadata)
        self.assertFalse(result.is_valid)
        self.assertIn("Article body content is empty.", result.errors)

    def test_h1_header_error(self):
        content = "# Duplicate H1\n\n## TL;DR\nContent goes here with words."
        result = self.validator.validate(content, self.valid_metadata)
        self.assertFalse(result.is_valid)
        self.assertTrue(any("top-level H1 header" in err for err in result.errors))

    def test_unbalanced_code_blocks(self):
        content = "## TL;DR\n\n```python\ndef test():\n    pass\n"
        result = self.validator.validate(content, self.valid_metadata)
        self.assertFalse(result.is_valid)
        self.assertTrue(any("Unbalanced code block fences" in err for err in result.errors))


if __name__ == "__main__":
    unittest.main()
