"""
AI Service for Almanac.
Central facade for AI generation, resolving the active provider and model dynamically.
"""

import os
from typing import Dict, Optional, Type

from .base import BaseAIProvider
from .gemini_provider import GeminiProvider
from .mock_provider import MockAIProvider
from .openai_provider import OpenAIProvider
from .openrouter_provider import OpenRouterProvider


class AIService:
    """
    Central service that coordinates AI model interactions across all providers.
    Decouples the generation pipeline from LLM vendors.
    """

    PROVIDER_REGISTRY: Dict[str, Type[BaseAIProvider]] = {
        "mock": MockAIProvider,
        "gemini": GeminiProvider,
        "openai": OpenAIProvider,
        "openrouter": OpenRouterProvider,
    }

    def __init__(
        self,
        provider_name: Optional[str] = None,
        model: Optional[str] = None,
    ):
        self._provider_name = (provider_name or os.getenv("AI_PROVIDER", "openrouter")).lower().strip()
        self._model_override = model or os.getenv("AI_MODEL")
        self._provider_instance: Optional[BaseAIProvider] = None

    @property
    def provider(self) -> BaseAIProvider:
        """Lazily initialize and return the active AI provider."""
        if self._provider_instance is None:
            provider_cls = self.PROVIDER_REGISTRY.get(self._provider_name)
            if not provider_cls:
                valid = ", ".join(self.PROVIDER_REGISTRY.keys())
                raise ValueError(
                    f"Unsupported AI provider: '{self._provider_name}'. Supported providers: {valid}"
                )
            self._provider_instance = provider_cls()
        return self._provider_instance

    @property
    def provider_name(self) -> str:
        return self.provider.name

    @property
    def active_model(self) -> str:
        return self._model_override or self.provider.default_model

    def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        model: Optional[str] = None,
        temperature: float = 0.7,
        **kwargs,
    ) -> str:
        """
        Generate text using the configured AI provider and active model.
        """
        target_model = model or self.active_model
        return self.provider.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            model=target_model,
            temperature=temperature,
            **kwargs,
        )
