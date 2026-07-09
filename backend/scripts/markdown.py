"""
Markdown utilities for Almanac.
Responsible for saving AI-generated articles to the correct location.
"""

from pathlib import Path
from datetime import date
import re

from config import KNOWLEDGE_DIR


def slugify(text: str) -> str:
    """Convert a title into a URL/file-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return text


def save_article(title: str, category: str, content: str) -> Path:
    """
    Save an article to the appropriate category folder.
    Returns the path of the created file.
    """

    category_dir = KNOWLEDGE_DIR / category
    category_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{slugify(title)}.md"
    filepath = category_dir / filename

    frontmatter = f"""---
title: "{title}"
category: "{category}"
date: "{date.today()}"
---

"""

    filepath.write_text(frontmatter + content, encoding="utf-8")

    return filepath