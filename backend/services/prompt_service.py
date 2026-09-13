"""
Prompt management service for Almanac.
Loads, validates, caches, and renders prompt templates from backend/prompts/.
"""

from pathlib import Path
from typing import Dict, Optional


class PromptService:
    """
    Manages externalized prompt templates, decoupling prompt engineering from Python code.
    """

    def __init__(self, prompts_dir: Optional[Path] = None):
        if prompts_dir is None:
            root_dir = Path(__file__).resolve().parents[2]
            self.prompts_dir = root_dir / "backend" / "prompts"
        else:
            self.prompts_dir = Path(prompts_dir)

        self._template_cache: Dict[str, str] = {}

    def get_template(self, template_name: str) -> str:
        """
        Load prompt template by filename (e.g. 'article_prompt.txt' or 'system_prompt.txt').
        """
        if template_name in self._template_cache:
            return self._template_cache[template_name]

        file_path = self.prompts_dir / template_name
        if not file_path.exists():
            raise FileNotFoundError(
                f"Prompt template '{template_name}' not found in {self.prompts_dir}"
            )

        content = file_path.read_text(encoding="utf-8").strip()
        if not content:
            raise ValueError(f"Prompt template '{template_name}' at {file_path} is empty.")

        self._template_cache[template_name] = content
        return content

    def render(self, template_name: str, **kwargs) -> str:
        """
        Load and interpolate template variables using keyword arguments.
        Missing optional keys default to empty strings.
        """
        template = self.get_template(template_name)
        # Use safe format with defaults
        formatted = template.format(**kwargs)
        return formatted

    def get_system_prompt(self) -> str:
        """Convenience method to retrieve the primary system prompt."""
        return self.get_template("system_prompt.txt")

    def get_article_prompt(
        self,
        title: str,
        category: str,
        description: str = "",
        tags: Optional[list] = None,
    ) -> str:
        """Convenience method to render the article generation prompt."""
        tags_str = ", ".join(tags) if tags else category
        return self.render(
            "article_prompt.txt",
            title=title,
            category=category,
            description=description or f"Engineering analysis of {title}.",
            tags=tags_str,
        )
