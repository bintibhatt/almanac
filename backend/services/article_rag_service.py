"""
Article-Grounded RAG Q&A service for Almanac.
Enables "Ask AI about this article" interactive chat grounded strictly in article context.
"""

from typing import Optional

from backend.ai.service import AIService
from backend.services.prompt_service import PromptService


class ArticleRAGService:
    """
    Service responsible for answering questions grounded in a specific knowledge article.
    """

    def __init__(
        self,
        ai_service: Optional[AIService] = None,
        prompt_service: Optional[PromptService] = None,
    ):
        self.ai_service = ai_service or AIService()
        self.prompt_service = prompt_service or PromptService()

    def answer_question(
        self,
        title: str,
        content: str,
        question: str,
    ) -> str:
        """
        Answer a user question grounded strictly in the provided article content.
        """
        system_prompt = self.prompt_service.get_system_prompt()
        prompt = self.prompt_service.render(
            "article_rag_prompt.txt",
            title=title,
            content=content[:4000],
            question=question,
        )

        response = self.ai_service.generate(prompt=prompt, system_prompt=system_prompt)
        return response.strip()
