"""
Main entry point and CLI orchestrator for Almanac.
Coordinates TopicService, DuplicateService, AIService, ArticleService, ValidationService, StateService, and Git automation.
"""

import argparse
import os
import sys
from pathlib import Path

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
from backend.scripts.config import AI_PROVIDER, validate_provider_config
from backend.scripts.git_utils import commit_and_push
from backend.services.article_service import ArticleService
from backend.services.duplicate_service import DuplicateService
from backend.services.prompt_service import PromptService
from backend.services.state_service import StateService
from backend.services.topic_service import TopicService
from backend.services.validation_service import ValidationService


def parse_args():
    parser = argparse.ArgumentParser(
        description="Almanac — Autonomous Engineering Knowledge Generator"
    )
    parser.add_argument(
        "--category",
        type=str,
        default=None,
        help="Filter topic selection to a specific category (e.g. ai, backend, devops, security)",
    )
    parser.add_argument(
        "--topic",
        type=str,
        default=None,
        help="Specify an exact topic title to generate (e.g. 'RAG - Architecture')",
    )
    parser.add_argument(
        "--provider",
        type=str,
        default=None,
        help="AI provider override ('mock', 'gemini', 'openai', 'openrouter')",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="Model identifier override (e.g. 'gemini-2.5-flash', 'gpt-4o-mini')",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force generation even if topic is flagged as duplicate",
    )
    parser.add_argument(
        "--strict-validation",
        action="store_true",
        help="Treat validation warnings as errors during pre-publish check",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Generate and preview the article without saving to disk or committing to Git",
    )
    parser.add_argument(
        "--no-git",
        action="store_true",
        help="Skip Git commit and push step",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    active_provider = (args.provider or AI_PROVIDER or "mock").lower().strip()

    # Validate provider credentials if not in dry-run or mock mode
    if active_provider != "mock":
        try:
            validate_provider_config(active_provider)
        except ValueError as val_err:
            print(f"⚠️ Provider configuration error: {val_err}")
            print("💡 Falling back to 'mock' provider for offline demonstration.")
            active_provider = "mock"

    # Initialize Services
    state_service = StateService()
    duplicate_service = DuplicateService(state_service=state_service)
    validation_service = ValidationService()
    topic_service = TopicService()

    # 1. Topic Ingestion & Selection
    try:
        topic = topic_service.select_topic(
            category=args.category,
            title=args.topic,
        )
    except Exception as err:
        print(f"❌ Topic selection failed: {err}")
        sys.exit(1)

    print(f"\n🚀 Almanac Ingestion Pipeline")
    print(f"   • Topic:      {topic.title}")
    print(f"   • Category:   {topic.category}")
    print(f"   • Source:     {topic.source}")
    print(f"   • Provider:   {active_provider}")
    if args.model:
        print(f"   • Model:      {args.model}")

    # 2. Duplicate Detection
    dup_result = duplicate_service.check_duplicate(topic)
    if dup_result.is_duplicate and not args.force:
        print(f"\n⚠️ Skip: Duplicate detected!")
        print(f"   • Reason:        {dup_result.reason}")
        print(f"   • Matched Topic: {dup_result.matched_title} ({dup_result.matched_slug})")
        print(f"💡 Use --force to regenerate this topic.\n")
        state_service.record_skip(topic, reason=dup_result.reason or "Duplicate topic")
        return

    if dup_result.is_duplicate and args.force:
        print(f"⚠️ Duplicate detected ({dup_result.reason}), but --force flag supplied. Proceeding...")

    # 3. Initialize AI & Article Services
    ai_service = AIService(provider_name=active_provider, model=args.model)
    prompt_service = PromptService()
    article_service = ArticleService(
        ai_service=ai_service,
        prompt_service=prompt_service,
    )

    # 4. Generate Article
    print(f"\n🧠 Generating technical engineering note...")
    try:
        body_content, metadata = article_service.generate_article(topic, model=args.model)
    except Exception as gen_err:
        error_msg = f"Generation error: {gen_err}"
        print(f"❌ {error_msg}")
        state_service.record_failure(topic, error=error_msg)
        sys.exit(1)

    print(f"   • Reading Time: {metadata['readingTime']}")
    print(f"   • Tags:         {', '.join(metadata['tags'])}")

    # 5. Article Validation
    val_result = validation_service.validate(
        body_content, metadata, strict=args.strict_validation
    )
    print(f"   • Word Count:   {val_result.word_count}")

    if val_result.warnings:
        for warn in val_result.warnings:
            print(f"   • ⚠️ Warning: {warn}")

    if not val_result.is_valid:
        error_msg = f"Article validation failed with {len(val_result.errors)} error(s): " + "; ".join(val_result.errors)
        print(f"❌ {error_msg}")
        state_service.record_failure(topic, error=error_msg)
        sys.exit(1)

    # Dry-run handling
    if args.dry_run:
        print("\n🔍 [DRY RUN PREVIEW] Frontmatter:")
        print(article_service.format_frontmatter(metadata))
        print("🔍 [DRY RUN PREVIEW] Content (first 500 characters):")
        print(body_content[:500] + "\n...\n")
        print("✅ Dry run completed. No files saved or committed.")
        return

    # 6. Save to Knowledge Base & Update State
    saved_path = article_service.save_article(topic, body_content, metadata)
    state_service.record_success(topic, metadata, file_path=saved_path)
    print(f"📄 Saved knowledge article to:\n   {saved_path}")

    # 7. Git Automation
    if not args.no_git:
        commit_message = f"docs({topic.category}): add note on {topic.title}"
        commit_and_push(saved_path, commit_message)
    else:
        print("ℹ️ Git commit skipped (--no-git).")

    print("\n✨ Generation pipeline completed successfully.\n")


if __name__ == "__main__":
    main()