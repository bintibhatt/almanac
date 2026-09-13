"""
Main entry point and CLI orchestrator for Almanac.
Coordinates TopicService, DuplicateService, AIService, ArticleService, ValidationService, StateService, VectorStoreService, and Git automation.
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
from backend.services.embedding_service import EmbeddingService
from backend.services.prompt_service import PromptService
from backend.services.state_service import StateService
from backend.services.topic_service import TopicService
from backend.services.validation_service import ValidationService
from backend.services.vector_store_service import VectorStoreService


def parse_args():
    parser = argparse.ArgumentParser(
        description="Almanac — Autonomous Engineering Knowledge Generator & Semantic Engine"
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
        "--search",
        type=str,
        default=None,
        help="Perform semantic vector search query against the Almanac knowledge base",
    )
    parser.add_argument(
        "--reindex",
        action="store_true",
        help="Reindex all existing Markdown files in knowledge/ into the vector store",
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


def handle_reindex(vector_store_service: VectorStoreService, knowledge_dir: Path):
    """Walk knowledge directory and index all articles."""
    print("\n🔍 Reindexing knowledge base into vector store...")
    count = 0
    for md_file in knowledge_dir.rglob("*.md"):
        try:
            raw_text = md_file.read_text(encoding="utf-8")
            slug = md_file.stem
            category = md_file.parent.name
            # Quick title parse
            title_match = [line for line in raw_text.splitlines() if line.startswith("title:")]
            title = title_match[0].split(":", 1)[1].strip(" \"'") if title_match else slug.replace("-", " ").title()

            vector_store_service.upsert_article(
                slug=slug,
                title=title,
                category=category,
                content=raw_text,
                metadata={"category": category},
            )
            count += 1
        except Exception as err:
            print(f"⚠️ Failed to index {md_file.name}: {err}")

    print(f"✅ Indexed {count} articles into vector store (shared/vector_index.json).\n")


def handle_search(vector_store_service: VectorStoreService, query: str, category: Optional[str] = None):
    """Perform CLI semantic search query."""
    print(f"\n🔍 Semantic Vector Search Results for query: '{query}'")
    results = vector_store_service.search_similar(query=query, top_k=5, category_filter=category)

    if not results:
        print("ℹ️ No matching articles found in vector store.")
        return

    for idx, item in enumerate(results, 1):
        print(f"\n  {idx}. {item['title']} (Score: {item['score']})")
        print(f"     Category: {item['category']} | Slug: {item['slug']}")
        if item.get("description"):
            print(f"     Description: {item['description']}")
    print("\n✨ Search completed.\n")


def main():
    args = parse_args()

    # Initialize Base Services
    state_service = StateService()
    embedding_service = EmbeddingService()
    vector_store_service = VectorStoreService(embedding_service=embedding_service)
    duplicate_service = DuplicateService(
        state_service=state_service,
        vector_store_service=vector_store_service,
    )
    validation_service = ValidationService()
    topic_service = TopicService()
    knowledge_dir = ROOT_DIR / "knowledge"

    # Handle Reindex Mode
    if args.reindex:
        handle_reindex(vector_store_service, knowledge_dir)
        if not args.topic and not args.search:
            return

    # Handle Search Mode
    if args.search:
        handle_search(vector_store_service, args.search, category=args.category)
        if not args.topic:
            return

    active_provider = (args.provider or AI_PROVIDER or "mock").lower().strip()

    # Validate provider credentials if not in dry-run or mock mode
    if active_provider != "mock":
        try:
            validate_provider_config(active_provider)
        except ValueError as val_err:
            print(f"⚠️ Provider configuration error: {val_err}")
            print("💡 Falling back to 'mock' provider for offline demonstration.")
            active_provider = "mock"

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

    # 2. Duplicate Detection (Slug, Title, Token Jaccard, Vector Cosine Similarity)
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

    # 6. Save to Knowledge Base & Update State & Vector Store Index
    saved_path = article_service.save_article(topic, body_content, metadata)
    state_service.record_success(topic, metadata, file_path=saved_path)

    vector_store_service.upsert_article(
        slug=topic.slug,
        title=topic.title,
        category=topic.category,
        content=body_content,
        metadata=metadata,
    )
    print(f"📄 Saved knowledge article to:\n   {saved_path}")
    print(f"🧠 Vector index updated (total indexed: {vector_store_service.get_index_size()})")

    # 7. Git Automation
    if not args.no_git:
        commit_message = f"docs({topic.category}): add note on {topic.title}"
        commit_and_push(saved_path, commit_message)
    else:
        print("ℹ️ Git commit skipped (--no-git).")

    print("\n✨ Generation pipeline completed successfully.\n")


if __name__ == "__main__":
    main()