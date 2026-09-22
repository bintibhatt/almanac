"""
Almanac Scheduler Daemon.
Runs periodic background knowledge discovery, AI generation, validation, and vector indexing.
"""

import argparse
from datetime import datetime, timezone
from pathlib import Path
import sys
import time

# Configure UTF-8 encoding for Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.ai.service import AIService
from backend.services.article_service import ArticleService
from backend.services.duplicate_service import DuplicateService
from backend.services.embedding_service import EmbeddingService
from backend.services.prompt_service import PromptService
from backend.services.state_service import StateService
from backend.services.topic_intelligence import TopicIntelligenceService
from backend.services.topic_service import TopicService
from backend.services.validation_service import ValidationService
from backend.services.vector_store_service import VectorStoreService


def run_scheduled_ingestion(provider: str = "mock", source: str = "all", category: str = None):
    """Execute single iteration of scheduled knowledge discovery and ingestion."""
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"\n[{timestamp}] Scheduled Knowledge Ingestion Triggered")

    state_service = StateService()
    embedding_service = EmbeddingService()
    vector_store_service = VectorStoreService(embedding_service=embedding_service)
    duplicate_service = DuplicateService(state_service=state_service, vector_store_service=vector_store_service)
    topic_intelligence = TopicIntelligenceService(duplicate_service=duplicate_service)
    topic_service = TopicService()
    validation_service = ValidationService()

    candidates = topic_service.get_all_topics(source_filter=source)
    if category:
        candidates = [c for c in candidates if c.category.lower() == category.lower()]

    ranked = topic_intelligence.rank_topics(candidates, top_k=5)
    if not ranked:
        print("Scheduler: No non-duplicate candidate topics available.")
        return

    top_topic = ranked[0].topic
    print(f"Scheduler Selected Topic: '{top_topic.title}' (Score: {ranked[0].score}/100)")

    ai_service = AIService(provider_name=provider)
    prompt_service = PromptService()
    article_service = ArticleService(ai_service=ai_service, prompt_service=prompt_service)

    try:
        body_content, metadata = article_service.generate_article(top_topic)
        val_result = validation_service.validate(body_content, metadata)

        if not val_result.is_valid:
            print(f"Validation failed: {val_result.errors}")
            state_service.record_failure(top_topic, error="Validation failed")
            return

        saved_path = article_service.save_article(top_topic, body_content, metadata)
        state_service.record_success(top_topic, metadata, file_path=saved_path)
        vector_store_service.upsert_article(
            slug=top_topic.slug,
            title=top_topic.title,
            category=top_topic.category,
            content=body_content,
            metadata=metadata,
        )
        print(f"Saved & indexed article: {saved_path}")
    except Exception as err:
        print(f"Scheduled ingestion error: {err}")
        state_service.record_failure(top_topic, error=str(err))


def main():
    parser = argparse.ArgumentParser(description="Almanac Scheduler Daemon")
    parser.add_argument("--interval-seconds", type=int, default=3600, help="Scheduler loop interval in seconds (default 3600s)")
    parser.add_argument("--max-runs", type=int, default=1, help="Max runs (default 1 for single execution)")
    parser.add_argument("--provider", type=str, default="mock", help="AI provider override")
    parser.add_argument("--source", type=str, default="all", help="Topic source filter")
    args = parser.parse_args()

    print(f"Starting Almanac Scheduler Daemon (Interval: {args.interval_seconds}s, Max Runs: {args.max_runs})")
    runs = 0

    while True:
        run_scheduled_ingestion(provider=args.provider, source=args.source)
        runs += 1

        if args.max_runs and runs >= args.max_runs:
            print("Scheduler execution limit reached. Exiting daemon.")
            break

        print(f"Sleeping for {args.interval_seconds} seconds...")
        time.sleep(args.interval_seconds)


if __name__ == "__main__":
    main()
