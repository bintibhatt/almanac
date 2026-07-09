"""
AI Writer for Almanac.
Generates Markdown articles using the configured AI provider.
"""

from config import (
    AI_PROVIDER,
    GEMINI_API_KEY,
    OPENAI_API_KEY,
    OPENROUTER_API_KEY,
)

SYSTEM_PROMPT = """
You are an experienced software engineer.

Write concise, technically accurate engineering notes.

Return ONLY markdown.

Structure:

# Title

## What is it?

## Why it matters

## How it works

## Example

## Key Takeaways

Keep the article around 500-800 words.
"""


def generate_article(topic: str) -> str:
    """
    Generate an article using the configured AI provider.
    """

    if AI_PROVIDER == "gemini":
        return _generate_gemini(topic)

    if AI_PROVIDER == "openai":
        return _generate_openai(topic)
    
    if AI_PROVIDER == 'openrouter':
        return _generate_openrouter(topic)

    raise ValueError(f"Unsupported provider: {AI_PROVIDER}")


def _generate_gemini(topic: str) -> str:
    from google import genai

    client = genai.Client(api_key=GEMINI_API_KEY)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"{SYSTEM_PROMPT}\n\nTopic: {topic}",
    )

    return response.text


# def _generate_openai(topic: str) -> str:
#     from openai import OpenAI

#     client = OpenAI(api_key=OPENAI_API_KEY)

#     response = client.responses.create(
#         model="gpt-5.1-mini",
#         input=f"{SYSTEM_PROMPT}\n\nTopic: {topic}",
#     )

#     return response.output_text

def _generate_openai(topic: str) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=OPENAI_API_KEY)

    response = client.responses.create(
        model="gpt-5-mini",
        input=f"{SYSTEM_PROMPT}\n\nTopic: {topic}",
    )

    return response.output_text

def _generate_openrouter(topic: str) -> str:
    from openai import OpenAI

    client = OpenAI(
        api_key=OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1",
    )

    response = client.chat.completions.create(
        model="deepseek/deepseek-chat-v3",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": f"Topic: {topic}",
            },
        ],
    )

    return response.choices[0].message.content