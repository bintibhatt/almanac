"""
OpenRouter AI provider for Almanac.
Uses the OpenAI SDK with OpenRouter base URL to access diverse open and proprietary models.
"""

import os
from typing import Optional

from .openai_provider import OpenAIProvider


class OpenRouterProvider(OpenAIProvider):
    """
    Provider utilizing OpenRouter API endpoint.
    Default model: deepseek/deepseek-chat-v3.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        default_model: str = "deepseek/deepseek-chat-v3",
    ):
        key = api_key or os.getenv("OPENROUTER_API_KEY")
        super().__init__(
            api_key=key,
            default_model=default_model,
            base_url="https://openrouter.ai/api/v1",
        )

    @property
    def name(self) -> str:
        return "openrouter"

    def _get_client(self):
        if not self._api_key:
            raise ValueError(
                "OpenRouterProvider requires OPENROUTER_API_KEY. Please set it in your environment or .env file."
            )
        return super()._get_client()
