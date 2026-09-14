"""
Quiz generation service for Almanac.
Generates structured technical multiple-choice quizzes from Markdown knowledge articles.
"""

import json
import re
from typing import Any, Dict, List, Optional

from backend.ai.service import AIService
from backend.services.prompt_service import PromptService


class QuizService:
    """
    Service responsible for generating interactive AI quizzes from article content.
    """

    def __init__(
        self,
        ai_service: Optional[AIService] = None,
        prompt_service: Optional[PromptService] = None,
    ):
        self.ai_service = ai_service or AIService()
        self.prompt_service = prompt_service or PromptService()

    def generate_quiz(
        self,
        title: str,
        category: str,
        content: str,
    ) -> List[Dict[str, Any]]:
        """
        Generate a list of structured quiz question dicts for an article.
        """
        system_prompt = self.prompt_service.get_system_prompt()
        prompt = self.prompt_service.render(
            "quiz_prompt.txt",
            title=title,
            category=category,
            content=content[:3000],
        )

        raw = self.ai_service.generate(prompt=prompt, system_prompt=system_prompt)
        cleaned = raw.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass

        # Fallback quiz structure when mock or unparseable output occurs
        return [
            {
                "id": "q1",
                "question": f"What is the primary architectural goal of {title}?",
                "options": [
                    f"To provide decoupled, scalable execution for {title}.",
                    "To eliminate all network latency permanently.",
                    "To replace database storage with memory buffers.",
                    "To bypass authorization checks in production.",
                ],
                "correct_index": 0,
                "difficulty": "Intermediate",
                "explanation": f"{title} provides decoupled operational boundaries and predictable system behavior.",
            },
            {
                "id": "q2",
                "question": f"Which pitfall commonly affects systems using {title}?",
                "options": [
                    "Over-configuration without monitoring metric thresholds.",
                    "Using standard HTTP protocol methods.",
                    "Writing automated unit test suites.",
                    "Structuring markdown documentation headers.",
                ],
                "correct_index": 0,
                "difficulty": "Intermediate",
                "explanation": f"Misconfiguration and lack of operational metrics are key risks when deploying {title}.",
            },
        ]
