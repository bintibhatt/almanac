"""
Configuration loader for almanac.
Loads environment variables and exposes them to the application.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root
ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")

# AI Provider
AI_PROVIDER = os.getenv("AI_PROVIDER", "openrouter").lower()

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Project Paths
KNOWLEDGE_DIR = ROOT_DIR / "knowledge"

TOPICS_FILE = ROOT_DIR / "backend" / "scripts" / "topics.json"

# Basic validation
if AI_PROVIDER not in {"gemini", "openai", "openrouter"}:
    raise ValueError(
        "AI_PROVIDER must be either 'gemini', 'openai', or 'openrouter'."
    )

if AI_PROVIDER == "gemini" and not GEMINI_API_KEY:
    raise ValueError("Missing GEMINI_API_KEY in .env")

if AI_PROVIDER == "openai" and not OPENAI_API_KEY:
    raise ValueError("Missing OPENAI_API_KEY in .env")

if AI_PROVIDER == "openrouter" and not OPENROUTER_API_KEY:
    raise ValueError("Missing OPENROUTER_API_KEY in .env")