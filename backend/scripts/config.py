"""
Configuration loader for EngineerOS.
Loads environment variables and exposes them to the application.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

# AI Provider
AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini").lower()

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Project Paths
CONTENT_DIR = ROOT_DIR / "content"
TOPICS_FILE = ROOT_DIR / "scripts" / "topics.json"

# Basic validation
if AI_PROVIDER not in {"gemini", "openai"}:
    raise ValueError(
        "AI_PROVIDER must be either 'gemini' or 'openai'."
    )

if AI_PROVIDER == "gemini" and not GEMINI_API_KEY:
    raise ValueError("Missing GEMINI_API_KEY in .env")

if AI_PROVIDER == "openai" and not OPENAI_API_KEY:
    raise ValueError("Missing OPENAI_API_KEY in .env")