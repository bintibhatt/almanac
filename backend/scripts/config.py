"""
Configuration loader for Almanac.
Loads environment variables and exposes paths and settings to the application.
"""

import os
from pathlib import Path

# Load .env if python-dotenv is available
ROOT_DIR = Path(__file__).resolve().parents[2]
env_path = ROOT_DIR / ".env"

try:
    from dotenv import load_dotenv
    if env_path.exists():
        load_dotenv(env_path)
except ImportError:
    pass

# AI Provider Settings
AI_PROVIDER = os.getenv("AI_PROVIDER", "mock").lower().strip()
AI_MODEL = os.getenv("AI_MODEL")

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Core Project Paths
BACKEND_DIR = ROOT_DIR / "backend"
KNOWLEDGE_DIR = ROOT_DIR / "knowledge"
PROMPTS_DIR = BACKEND_DIR / "prompts"
TOPICS_FILE = BACKEND_DIR / "scripts" / "topics.json"


def validate_provider_config(provider_name: str) -> None:
    """
    Validate provider-specific credentials on demand rather than crashing module import.
    """
    prov = provider_name.lower().strip()
    valid_providers = {"mock", "gemini", "openai", "openrouter"}

    if prov not in valid_providers:
        raise ValueError(
            f"AI_PROVIDER must be one of {valid_providers}, got '{prov}'"
        )

    if prov == "gemini" and not os.getenv("GEMINI_API_KEY"):
        raise ValueError("Missing GEMINI_API_KEY in environment or .env file.")

    if prov == "openai" and not os.getenv("OPENAI_API_KEY"):
        raise ValueError("Missing OPENAI_API_KEY in environment or .env file.")

    if prov == "openrouter" and not os.getenv("OPENROUTER_API_KEY"):
        raise ValueError("Missing OPENROUTER_API_KEY in environment or .env file.")