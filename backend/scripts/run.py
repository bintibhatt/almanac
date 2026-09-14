"""
Main entry point and CLI orchestrator for Almanac.
Coordinates TopicService, TopicIntelligenceService, DuplicateService, AIService,
ArticleService, ValidationService, StateService, VectorStoreService, HybridSearchService,
RetrievalService, and Git automation.
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
from backend.services.hybrid_search_service import HybridSearchService
from backend.services.prompt_service import PromptService
from backend.services.retrieval_service import RetrievalService
from backend.services.state_service import StateService
from backend.services.topic_intelligence import TopicIntelligenceService
from backend.services.topic_service import TopicService
from backend.services.validation_service import ValidationService
from backend.services.vector_store_service import VectorStoreService


def parse_args():
    parser = argparse.ArgumentParser(
        description="Almanac — Autonomous Engineering Knowledge Generator & Semantic Hybrid Engine"
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
        "--source",
        type=str,
        default=None,
        help="Filter topic ingestion source ('manual', 'github', 'hackernews', 'all')",
    )
    parser.add_argument(
        "--rank-topics",
        action="store_true",
        help="Rank candidate topics using Topic Intelligence AI scoring across providers",
    )
    parser.add_argument(
        "--search",
        type=str,
        default=None,
        help="Perform semantic vector search query against the Almanac knowledge base",
    )
    parser.add_argument(
        "--search-hybrid",
        type=str,
        default=None,
        help="Perform RRF Hybrid Search (BM25 keyword + vector similarity) against knowledge base",
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


def handle_hybrid_search(hybrid_search_service: HybridSearchService, query: str, category: Optional[str] = None):
    """Perform RRF Hybrid Search query."""
    print(f"\n⚡ RRF Hybrid Search (BM25 Keyword + Vector Similarity) for query: '{query}'")
    results = hybrid_search_service.hybrid_search(query=query, top_k=5, category_filter=category)

    if not results:
        print("ℹ️ No matching articles found.")
        return

    for idx, item in enumerate(results, 1):
        print(f"\n  {idx}. {item['title']} (RRF Score: {item['hybrid_score']:.2f})")
        print(f"     Category: {item['category']} | Slug: {item['slug']}")
        print(f"     Ranks -> Keyword: #{item['kw_rank']} | Vector: #{item['vec_rank']}")
        if item.get("description"):
            print(f"     Description: {item['description']}")
    print("\n✨ Hybrid search completed.\n")


def handle_rank_topics(topic_service: TopicService, topic_intelligence: TopicIntelligenceService, source: Optional[str] = None, category: Optional[str] = None):
    """Rank candidate topics using AI Topic Intelligence."""
    print("\n📊 Almanac Topic Intelligence — Candidate Ranking")
    all_candidates = topic_service.get_all_topics(source_filter=source)
    if category:
        all_candidates = [t for t in all_candidates if t.category.lower() == category.lower()]

    ranked = topic_intelligence.rank_topics(all_candidates, top_k=10)
    if not ranked:
        print("ℹ️ No non-duplicate candidate topics available.")
        return

    for item in ranked:
        t = item.topic
        print(f"\n  Rank #{item.rank} | Score: {item.score}/100")
        print(f"   • Topic:      {t.title}")
        print(f"   • Category:   {t.category}")
        print(f"   • Source:     {t.source} ({t.source_url or 'N/A'})")
        print(f"   • Reasoning:  {item.reasoning}")

    print("\n✨ Ranking completed.\n")


def main():
    args = parse_args()

    # Initialize Base Services
    state_service = StateService()
    embedding_service = EmbeddingService()
    vector_store_service = VectorStoreService(embedding_service=embedding_service)
    hybrid_search_service = HybridSearchService(vector_store_service=vector_store_service)
    retrieval_service = RetrievalService(hybrid_search_service=hybrid_search_service)
    duplicate_service = DuplicateService(
        state_service=state_service,
        vector_store_service=vector_store_service,
    )
    topic_intelligence = TopicIntelligenceService(duplicate_service=duplicate_service)
    validation_service = ValidationService()
    topic_service = TopicService()
    knowledge_dir = ROOT_DIR / "knowledge"

    # Handle Reindex Mode
    if args.reindex:
        handle_reindex(vector_store_service, knowledge_dir)
        if not args.topic and not args.search and not args.search_hybrid and not args.rank_topics:
            return

    # Handle Vector Search Mode
    if args.search:
        handle_search(vector_store_service, args.search, category=args.category)
        if not args.topic and not args.search_hybrid and not args.rank_topics:
            return

    # Handle Hybrid Search Mode
    if args.search_hybrid:
        handle_hybrid_search(hybrid_search_service, args.search_hybrid, category=args.category)
        if not args.topic:
            return

    # Handle Rank Topics Mode
    if args.rank_topics:
        handle_rank_topics(topic_service, topic_intelligence, source=args.source, category=args.category)
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

    # 1. Topic Ingestion & Selection (using Topic Intelligence when multiple candidates exist)
    try:
        if not args.topic:
            candidates = topic_service.get_all_topics(source_filter=args.source)
            if args.category:
                candidates = [c for c in candidates if c.category.lower() == args.category.lower()]

            ranked_candidates = topic_intelligence.rank_topics(candidates, top_k=5)
            if ranked_candidates:
                topic = ranked_candidates[0].topic
                print(f"🎯 Selected #1 Ranked Topic: '{topic.title}' (Score: {ranked_candidates[0].score}/100)")
            else:
                topic = topic_service.select_topic(category=args.category, source=args.source)
        else:
            topic = topic_service.select_topic(category=args.category, title=args.topic, source=args.source)
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

    # 3. Context Research & Grounding Retrieval
    retrieved_context = retrieval_service.retrieve_context(topic)
    if retrieved_context:
        print(f"📚 Retrieved supporting knowledge context from vector store for prompt grounding.")

    # 4. Initialize AI & Article Services
    ai_service = AIService(provider_name=active_provider, model=args.model)
    prompt_service = PromptService()
    article_service = ArticleService(
        ai_service=ai_service,
        prompt_service=prompt_service,
    )

    # 5. Generate Article
    print(f"\n🧠 Generating technical engineering note...")
    try:
        body_content, metadata = article_service.generate_article(
            topic, model=args.model, retrieved_context=retrieved_context
        )
    except Exception as gen_err:
        error_msg = f"Generation error: {gen_err}"
        print(f"❌ {error_msg}")
        state_service.record_failure(topic, error=error_msg)
        sys.exit(1)

    print(f"   • Reading Time: {metadata['readingTime']}")
    print(f"   • Tags:         {', '.join(metadata['tags'])}")

    # 6. Article Validation
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

    # 7. Save to Knowledge Base & Update State & Vector Store Index
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

    # 8. Git Automation
    if not args.no_git:
        commit_message = f"docs({topic.category}): add note on {topic.title}"
        commit_and_push(saved_path, commit_message)
    else:
        print("ℹ️ Git commit skipped (--no-git).")

    print("\n✨ Generation pipeline completed successfully.\n")


if __name__ == "__main__":
    main()