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
        
        # Build list of models to try (primary target + fallback options)
        models_to_try = [target_model]
        fallback_candidates = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
        for candidate in fallback_candidates:
            if candidate not in models_to_try:
                models_to_try.append(candidate)

        full_content = f"{system_prompt}\n\n{prompt}".strip() if system_prompt else prompt

        last_error = None
        for current_model in models_to_try:
            try:
                response = client.models.generate_content(
                    model=current_model,
                    contents=full_content,
                )
                return response.text or ""
            except Exception as err:
                last_error = err
                err_str = str(err).lower()
                # If model is 404 / NOT_FOUND / unavailable, try fallback models
                if "404" in err_str or "not_found" in err_str or "no longer available" in err_str:
                    continue
                raise RuntimeError(f"Gemini generation failed on model '{current_model}': {err}") from err

        raise RuntimeError(f"Gemini generation failed across models {models_to_try}: {last_error}") from last_error

