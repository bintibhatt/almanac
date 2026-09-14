"""
Interview Question and Model Answer service for Almanac.
Generates level-graded technical interview prep questions from knowledge articles.
"""

import json
from typing import Any, Dict, List, Optional

from backend.ai.service import AIService
from backend.services.prompt_service import PromptService


class InterviewService:
    """
    Service responsible for generating interview questions and model answers from articles.
    """

    def __init__(
        self,
        ai_service: Optional[AIService] = None,
        prompt_service: Optional[PromptService] = None,
    ):
        self.ai_service = ai_service or AIService()
        self.prompt_service = prompt_service or PromptService()

    def generate_interview_questions(
        self,
        title: str,
        category: str,
        content: str,
    ) -> List[Dict[str, Any]]:
        """
        Generate level-graded interview questions and model answers.
        """
        system_prompt = self.prompt_service.get_system_prompt()
        prompt = self.prompt_service.render(
            "interview_prompt.txt",
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

        # Fallback interview question structure
        return [
            {
                "id": "iq1",
                "level": "Intermediate",
                "question": f"How would you explain the core architecture of {title} during a system design interview?",
                "model_answer": f"I would describe {title} by breaking down its ingress data flow, internal mechanics, resource limits, and failure recovery domains.",
                "follow_up_prompt": "How does this scale when network latency spikes across availability zones?",
            },
            {
                "id": "iq2",
                "level": "Senior",
                "question": f"What common production failure modes occur with {title} and how do you mitigate them?",
                "model_answer": f"Failure modes include resource exhaustion and unhandled timeout cascades. Mitigation requires circuit breakers and strict resource quotas.",
                "follow_up_prompt": "What telemetry metrics would you monitor on your dashboard?",
            },
        ]
