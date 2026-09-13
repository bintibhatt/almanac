"""
OpenAI AI provider for Almanac.
Uses the official OpenAI Python SDK.
"""

import os
from typing import Optional

from .base import BaseAIProvider


class OpenAIProvider(BaseAIProvider):
    """
    Provider utilizing OpenAI models (e.g. gpt-4o-mini, gpt-4o).
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        default_model: str = "gpt-4o-mini",
        base_url: Optional[str] = None,
    ):
        self._api_key = api_key or os.getenv("OPENAI_API_KEY")
        self._default_model = os.getenv("AI_MODEL") or default_model
        self._base_url = base_url
        self._client = None

    @property
    def name(self) -> str:
        return "openai"

    @property
    def default_model(self) -> str:
        return self._default_model

    def _get_client(self):
        if self._client is not None:
            return self._client

        if not self._api_key:
            raise ValueError(
                "OpenAIProvider requires OPENAI_API_KEY. Please set it in your environment or .env file."
            )

        try:
            from openai import OpenAI
            self._client = OpenAI(
                api_key=self._api_key,
                base_url=self._base_url,
            )
            return self._client
        except ImportError as err:
            raise ImportError(
                "openai package is required for OpenAIProvider. "
                "Install it with: pip install openai"
            ) from err

    def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        model: Optional[str] = None,
        temperature: float = 0.7,
        **kwargs,
    ) -> str:
        client = self._get_client()
        target_model = model or self._default_model

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            response = client.chat.completions.create(
                model=target_model,
                messages=messages,
                temperature=temperature,
            )
            choice = response.choices[0]
            return choice.message.content or ""
        except Exception as err:
            raise RuntimeError(f"OpenAI generation failed on model '{target_model}': {err}") from err
