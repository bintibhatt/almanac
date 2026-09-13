"""
Base interface for AI providers in Almanac.
"""

from abc import ABC, abstractmethod
from typing import Optional


class BaseAIProvider(ABC):
    """
    Abstract base class for all AI text generation providers.
    Decouples Almanac services from specific LLM vendors and SDKs.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Name of the provider (e.g., 'gemini', 'openai', 'openrouter', 'mock')."""
        pass

    @property
    @abstractmethod
    def default_model(self) -> str:
        """Default model identifier used by this provider."""
        pass

    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        model: Optional[str] = None,
        temperature: float = 0.7,
        **kwargs,
    ) -> str:
        """
        Generate text response for the given prompt and optional system prompt.
        """
        pass
