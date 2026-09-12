"""
Google Gemini AI provider for Almanac.
Uses the modern google-genai SDK.
"""

import os
from typing import Optional

from .base import BaseAIProvider


class GeminiProvider(BaseAIProvider):
    """
    Provider utilizing Google Gemini models via google-genai.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        default_model: str = "gemini-2.5-flash",
    ):
        self._api_key = api_key or os.getenv("GEMINI_API_KEY")
        self._default_model = os.getenv("AI_MODEL") or default_model
        self._client = None

    @property
    def name(self) -> str:
        return "gemini"

    @property
    def default_model(self) -> str:
        return self._default_model

    def _get_client(self):
        if self._client is not None:
            return self._client

        if not self._api_key:
            raise ValueError(
                "GeminiProvider requires GEMINI_API_KEY. Please set it in your environment or .env file."
            )

        try:
            from google import genai
            self._client = genai.Client(api_key=self._api_key)
            return self._client
        except ImportError as err:
            raise ImportError(
                "google-genai package is required for GeminiProvider. "
                "Install it with: pip install google-genai"
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

        full_content = f"{system_prompt}\n\n{prompt}".strip() if system_prompt else prompt

        try:
            response = client.models.generate_content(
                model=target_model,
                contents=full_content,
            )
            return response.text or ""
        except Exception as err:
            raise RuntimeError(f"Gemini generation failed on model '{target_model}': {err}") from err
