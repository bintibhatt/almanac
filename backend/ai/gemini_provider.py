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
        
        # Build comprehensive list of standard model candidates
        candidates = [
            target_model,
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-2.0-flash-exp",
            "gemini-2.0-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro-latest",
            "gemini-1.5-flash-002",
            "gemini-1.5-flash-001",
            "gemini-1.5-flash",
        ]
        
        models_to_try = []
        seen = set()
        for candidate in candidates:
            c_clean = candidate.strip()
            if c_clean and c_clean not in seen:
                seen.add(c_clean)
                models_to_try.append(c_clean)

        # Dynamically query Google API ModelService if static candidates need expansion
        try:
            for m in client.models.list():
                m_name = getattr(m, "name", "") or str(m)
                m_clean = m_name.replace("models/", "").strip()
                if m_clean and m_clean not in seen and "gemini" in m_clean.lower():
                    seen.add(m_clean)
                    models_to_try.append(m_clean)
        except Exception:
            pass

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
                # If model is 404 / NOT_FOUND / unsupported, continue trying fallback models
                if "404" in err_str or "not_found" in err_str or "not found" in err_str or "no longer available" in err_str:
                    continue
                raise RuntimeError(f"Gemini generation failed on model '{current_model}': {err}") from err

        raise RuntimeError(f"Gemini generation failed across all attempted models {models_to_try}: {last_error}") from last_error


