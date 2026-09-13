"""
Article generation and persistence service for Almanac.
Coordinates AIService, PromptService, and structured markdown output.
"""

from datetime import datetime, timezone
import math
from pathlib import Path
import re
from typing import Dict, Optional, Tuple

from backend.ai.service import AIService
from backend.providers.base import Topic
from backend.services.prompt_service import PromptService


def calculate_reading_time(content: str) -> str:
    """Calculate human reading time based on ~220 words per minute."""
    words = len(re.findall(r"\w+", content))
    minutes = max(1, math.ceil(words / 220))
    return f"{minutes} min read"


def clean_generated_markdown(content: str) -> str:
    """
    Sanitize generated markdown:
    - Strip conversational code fences (```markdown ... ```) if wrapped by LLM
    - Remove accidental leading H1 (# Title) to avoid duplicate titles in frontend
    """
    cleaned = content.strip()

    # Unwrap triple backticks if the whole output was wrapped
    if cleaned.startswith("```markdown"):
        cleaned = cleaned[len("```markdown"):].strip()
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3].strip()
    elif cleaned.startswith("```md"):
        cleaned = cleaned[len("```md"):].strip()
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3].strip()
    elif cleaned.startswith("```") and cleaned.endswith("```"):
        cleaned = cleaned[3:-3].strip()

    # Remove any accidental leading # H1 line
    lines = cleaned.splitlines()
    while lines and (not lines[0].strip() or lines[0].strip().startswith("# ")):
        lines.pop(0)

    return "\n".join(lines).strip()


class ArticleService:
    """
    Coordinates prompt construction, AI invocation, metadata formatting, and storage.
    """

    def __init__(
        self,
        ai_service: Optional[AIService] = None,
        prompt_service: Optional[PromptService] = None,
        knowledge_dir: Optional[Path] = None,
    ):
        self.ai_service = ai_service or AIService()
        self.prompt_service = prompt_service or PromptService()

        if knowledge_dir is None:
            root_dir = Path(__file__).resolve().parents[2]
            self.knowledge_dir = root_dir / "knowledge"
        else:
            self.knowledge_dir = Path(knowledge_dir)

    def generate_article(
        self,
        topic: Topic,
        model: Optional[str] = None,
    ) -> Tuple[str, Dict[str, str]]:
        """
        Generate article markdown content and metadata dictionary for a topic.
        """
        system_prompt = self.prompt_service.get_system_prompt()
        prompt = self.prompt_service.get_article_prompt(
            title=topic.title,
            category=topic.category,
            description=topic.description,
            tags=topic.tags,
        )

        raw_content = self.ai_service.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            model=model,
        )

        body_content = clean_generated_markdown(raw_content)
        reading_time = calculate_reading_time(body_content)
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        today_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        metadata = {
            "title": topic.title,
            "description": topic.description or f"Comprehensive guide to {topic.title}.",
            "slug": topic.slug,
            "category": topic.category,
            "tags": topic.tags,
            "difficulty": topic.difficulty,
            "readingTime": reading_time,
            "published": today_date,
            "updated": today_date,
            "source": topic.source,
            "sourceUrl": topic.source_url,
            "provider": self.ai_service.provider_name,
            "model": model or self.ai_service.active_model,
            "generatedAt": now_iso,
            "version": "1.0",
        }

        return body_content, metadata

    def format_frontmatter(self, metadata: Dict) -> str:
        """Format metadata into standard YAML frontmatter block."""
        tags_formatted = "\n".join([f'  - "{t}"' for t in metadata["tags"]])
        return f"""---
title: "{metadata['title']}"
description: "{metadata['description']}"
slug: "{metadata['slug']}"
category: "{metadata['category']}"
tags:
{tags_formatted}
difficulty: "{metadata['difficulty']}"
readingTime: "{metadata['readingTime']}"
published: "{metadata['published']}"
updated: "{metadata['updated']}"
source: "{metadata['source']}"
sourceUrl: "{metadata['sourceUrl']}"
provider: "{metadata['provider']}"
model: "{metadata['model']}"
generatedAt: "{metadata['generatedAt']}"
version: "{metadata['version']}"
---

"""

    def save_article(
        self,
        topic: Topic,
        body_content: str,
        metadata: Dict,
    ) -> Path:
        """
        Save the formatted article into knowledge/{category}/{slug}.md.
        """
        category_dir = self.knowledge_dir / topic.category
        category_dir.mkdir(parents=True, exist_ok=True)

        file_path = category_dir / f"{topic.slug}.md"
        frontmatter = self.format_frontmatter(metadata)
        full_text = frontmatter + body_content.strip() + "\n"

        file_path.write_text(full_text, encoding="utf-8")
        return file_path

    def produce_and_save(
        self,
        topic: Topic,
        model: Optional[str] = None,
    ) -> Tuple[Path, Dict]:
        """
        End-to-end convenience method: generates and persists article for a topic.
        """
        body_content, metadata = self.generate_article(topic, model=model)
        file_path = self.save_article(topic, body_content, metadata)
        return file_path, metadata
