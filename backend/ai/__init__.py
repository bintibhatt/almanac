"""
AI abstraction package for Almanac.
"""

from .base import BaseAIProvider
from .gemini_provider import GeminiProvider
from .mock_provider import MockAIProvider
from .openai_provider import OpenAIProvider
from .openrouter_provider import OpenRouterProvider
from .service import AIService

__all__ = [
    "BaseAIProvider",
    "GeminiProvider",
    "OpenAIProvider",
    "OpenRouterProvider",
    "MockAIProvider",
    "AIService",
]
