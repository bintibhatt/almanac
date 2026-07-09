"""
AI Writer for EngineerOS.
Generates Markdown articles using the configured AI provider.
"""

from backend.scripts.config import (
    AI_PROVIDER,
    GEMINI_API_KEY,
    OPENAI_API_KEY,
)

SYSTEM_PROMPT = """
You are an experienced software engineer writing documentation for Almanac.

Your task is to produce high-quality engineering notes.

IMPORTANT RULES:

- Return ONLY valid Markdown.
- DO NOT include a title (# Heading).
- DO NOT repeat the topic name as a heading.
- The title is already stored in the article metadata.
- Start directly with a level-2 heading.

Use exactly this structure:

## What is it?

Explain the concept clearly.

## Why it matters

Explain real-world importance.

## How it works

Describe the internal working with simple examples.

## Example

Provide practical code or architecture examples whenever possible.

## Key Takeaways

Summarize the most important points as bullet points.

Write between 700 and 1000 words.

Do not include introductions such as "Here is your article".
Do not wrap the response in code blocks.
Return only Markdown.
"""

def generate_article(topic: str) -> str:
    """
    Generate an article using the configured AI provider.
    """

    if AI_PROVIDER == "gemini":
        return _generate_gemini(topic)

    if AI_PROVIDER == "openai":
        return _generate_openai(topic)

    raise ValueError(f"Unsupported provider: {AI_PROVIDER}")


def _generate_gemini(topic: str) -> str:
    from google import genai

    client = genai.Client(api_key=GEMINI_API_KEY)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"{SYSTEM_PROMPT}\n\nTopic: {topic}",
    )

    return response.text


def _generate_openai(topic: str) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=OPENAI_API_KEY)

    response = client.responses.create(
        model="gpt-5.1-mini",
        input=f"{SYSTEM_PROMPT}\n\nTopic: {topic}",
    )

    return response.output_text