"""
AI Writer for Almanac.
Provides backward-compatible helper functions delegating to AIService and PromptService.
"""

from typing import Optional
from backend.ai.service import AIService
from backend.services.prompt_service import PromptService


def generate_article(topic: str, category: str = "backend", model: Optional[str] = None) -> str:
    """
    Generate an article using the central AIService and PromptService.
    Preserved for backward compatibility.
    """
    ai_service = AIService()
    prompt_service = PromptService()

    system_prompt = prompt_service.get_system_prompt()
    prompt = prompt_service.get_article_prompt(
        title=topic,
        category=category,
    )

    return ai_service.generate(
        prompt=prompt,
        system_prompt=system_prompt,
        model=model,
    )