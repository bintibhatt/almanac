"""
Main entry point and CLI orchestrator for Almanac.
Coordinates TopicService, TopicIntelligenceService, DuplicateService, AIService,
ArticleService, ValidationService, StateService, VectorStoreService, HybridSearchService,
RetrievalService, QuizService, FlashcardService, InterviewService, ArticleRAGService, and Git automation.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

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
from backend.providers.base import Topic
from backend.scripts.config import AI_PROVIDER, validate_provider_config
from backend.scripts.git_utils import commit_and_push
from backend.services.article_rag_service import ArticleRAGService
from backend.services.article_service import ArticleService
from backend.services.course_service import CourseService
from backend.services.duplicate_service import DuplicateService
from backend.services.embedding_service import EmbeddingService
from backend.services.flashcard_service import FlashcardService
from backend.services.hybrid_search_service import HybridSearchService
from backend.services.interview_service import InterviewService
from backend.services.prompt_service import PromptService
from backend.services.quiz_service import QuizService
from backend.services.retrieval_service import RetrievalService
from backend.services.state_service import StateService
from backend.services.topic_intelligence import TopicIntelligenceService
from backend.services.topic_service import TopicService
from backend.services.validation_service import ValidationService
from backend.services.vector_store_service import VectorStoreService


def parse_args():
    parser = argparse.ArgumentParser(
        description="Almanac — Autonomous Engineering Knowledge Generator & Interactive Intelligence System"
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
        "--quiz",
        type=str,
        default=None,
        help="Generate an interactive AI quiz for a note slug (e.g. 'rag---architecture')",
    )
    parser.add_argument(
        "--flashcards",
        type=str,
        default=None,
        help="Generate spaced repetition concept flashcards for a note slug",
    )
    parser.add_argument(
        "--interview",
        type=str,
        default=None,
        help="Generate technical interview preparation questions for a note slug",
    )
    parser.add_argument(
        "--ask-article",
        type=str,
        default=None,
        help="Ask grounded AI question about a note slug (use with --question)",
    )
    parser.add_argument(
        "--question",
        type=str,
        default=None,
        help="User question to ask grounded article RAG model",
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
    # Almanac v2 CLI Arguments
    parser.add_argument(
        "--generate-note",
        type=str,
        default=None,
        help="Generate or retrieve a user-requested note on any engineering topic",
    )
    parser.add_argument(
        "--generate-course",
        type=str,
        default=None,
        help="Generate an independent, structured engineering course curriculum",
    )
    parser.add_argument(
        "--course-level",
        type=str,
        default="Intermediate",
        help="Target course level ('Beginner', 'Intermediate', 'Advanced')",
    )
    parser.add_argument(
        "--course-goal",
        type=str,
        default=None,
        help="User-defined learning goal for course generation",
    )
    parser.add_argument(
        "--course-time",
        type=str,
        default=None,
        help="Target time commitment per day/week for course generation",
    )
    parser.add_argument(
        "--generate-interview-plan",
        type=str,
        default=None,
        help="Generate a role-based interview preparation plan and graded question bank",
    )
    parser.add_argument(
        "--interview-exp",
        type=str,
        default="Mid-Level (2-4 yrs)",
        help="Experience level for interview plan generation",
    )
    parser.add_argument(
        "--interview-focus",
        type=str,
        default=None,
        help="Primary focus technologies/domains for interview prep",
    )
    parser.add_argument(
        "--interview-company",
        type=str,
        default=None,
        help="Optional company context for interview prep",
    )
    parser.add_argument(
        "--evaluate-interview-answer",
        action="store_true",
        help="Evaluate candidate technical answer against question and model answer",
    )
    parser.add_argument(
        "--model-answer",
        type=str,
        default="",
        help="Model reference answer for interview evaluation",
    )
    parser.add_argument(
        "--user-answer",
        type=str,
        default="",
        help="Candidate submitted answer to evaluate",
    )
    return parser.parse_args()



def load_article_content(knowledge_dir: Path, slug: str):
    """Find and return Markdown content for an article slug."""
    for md_file in knowledge_dir.rglob("*.md"):
        if md_file.stem == slug:
            return md_file.name, md_file.read_text(encoding="utf-8")
    return None, None


def handle_quiz(quiz_service: QuizService, knowledge_dir: Path, slug: str):
    """Handle CLI quiz generation."""
    filename, content = load_article_content(knowledge_dir, slug)
    if not content:
        print(f"❌ Article slug '{slug}' not found in knowledge base.")
        return

    print(f"\n🧠 Generating AI Quiz for article: '{slug}'...")
    questions = quiz_service.generate_quiz(title=slug, category="backend", content=content)
    print(json.dumps(questions, indent=2))
    print("\n✨ Quiz generation completed.\n")


def handle_flashcards(flashcard_service: FlashcardService, knowledge_dir: Path, slug: str):
    """Handle CLI flashcard generation."""
    filename, content = load_article_content(knowledge_dir, slug)
    if not content:
        print(f"❌ Article slug '{slug}' not found in knowledge base.")
        return

    print(f"\n🎴 Generating Concept Flashcards for article: '{slug}'...")
    cards = flashcard_service.generate_flashcards(title=slug, category="backend", content=content)
    print(json.dumps(cards, indent=2))
    print("\n✨ Flashcard generation completed.\n")


def handle_interview(interview_service: InterviewService, knowledge_dir: Path, slug: str):
    """Handle CLI interview question generation."""
    filename, content = load_article_content(knowledge_dir, slug)
    if not content:
        print(f"❌ Article slug '{slug}' not found in knowledge base.")
        return

    print(f"\n🎯 Generating Technical Interview Questions for article: '{slug}'...")
    questions = interview_service.generate_interview_questions(title=slug, category="backend", content=content)
    print(json.dumps(questions, indent=2))
    print("\n✨ Interview generation completed.\n")


def handle_ask_article(rag_service: ArticleRAGService, knowledge_dir: Path, slug: str, question: Optional[str]):
    """Handle CLI grounded article RAG Q&A."""
    filename, content = load_article_content(knowledge_dir, slug)
    if not content:
        print(f"❌ Article slug '{slug}' not found in knowledge base.")
        return

    user_q = question or "Explain the primary architectural trade-offs discussed in this article."
    print(f"\n💬 Asking Grounded AI about '{slug}'...")
    print(f"   • Question: {user_q}\n")

    answer = rag_service.answer_question(title=slug, content=content, question=user_q)
    print(f"🤖 Answer:\n{answer}\n")


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


def handle_generate_note(
    topic_title: str,
    category: Optional[str],
    duplicate_service: DuplicateService,
    article_service: ArticleService,
    validation_service: ValidationService,
    state_service: StateService,
    vector_store_service: VectorStoreService,
    retrieval_service: RetrievalService,
    model: Optional[str] = None,
    force: bool = False,
    no_git: bool = True,
):
    """
    Handle user-requested note generation.
    Checks duplicate first; if highly similar, returns existing note info.
    Otherwise generates, validates, saves, indexes, and returns note details.
    """
    clean_title = topic_title.strip()
    if not clean_title:
        print(json.dumps({"success": False, "error": "Topic title cannot be empty."}))
        return

    if len(clean_title) > 200:
        print(json.dumps({"success": False, "error": "Topic title exceeds 200 character limit."}))
        return

    topic = Topic(
        title=clean_title,
        category=category or "backend",
        description=f"Deep-dive technical note on {clean_title}.",
        source="user-request",
    )

    dup_result = duplicate_service.check_duplicate(topic)
    if dup_result.is_duplicate and not force:
        print(json.dumps({
            "success": True,
            "already_exists": True,
            "note": {
                "slug": dup_result.matched_slug,
                "title": dup_result.matched_title,
                "reason": dup_result.reason,
            }
        }))
        return

    retrieved_context = retrieval_service.retrieve_context(topic)
    try:
        body_content, metadata = article_service.generate_article(
            topic, model=model, retrieved_context=retrieved_context
        )
    except Exception as err:
        print(json.dumps({"success": False, "error": f"Generation failed: {err}"}))
        return

    val_result = validation_service.validate(body_content, metadata)
    if not val_result.is_valid:
        print(json.dumps({
            "success": False,
            "error": "Validation failed: " + "; ".join(val_result.errors)
        }))
        return

    saved_path = article_service.save_article(topic, body_content, metadata)
    state_service.record_success(topic, metadata, file_path=saved_path)
    vector_store_service.upsert_article(
        slug=topic.slug,
        title=topic.title,
        category=topic.category,
        content=body_content,
        metadata=metadata,
    )

    if not no_git:
        try:
            commit_message = f"docs({topic.category}): add user-requested note on {topic.title}"
            commit_and_push(saved_path, commit_message)
        except Exception:
            pass

    print(json.dumps({
        "success": True,
        "already_exists": False,
        "slug": topic.slug,
        "title": topic.title,
        "category": topic.category,
        "reading_time": metadata.get("readingTime", "5 min read"),
        "description": metadata.get("description", ""),
        "file_path": str(saved_path),
    }))


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

    # Initialize Base Services
    ai_service = AIService(provider_name=active_provider, model=args.model)
    prompt_service = PromptService()
    state_service = StateService()
    embedding_service = EmbeddingService()
    vector_store_service = VectorStoreService(embedding_service=embedding_service)
    hybrid_search_service = HybridSearchService(vector_store_service=vector_store_service)
    retrieval_service = RetrievalService(hybrid_search_service=hybrid_search_service)
    duplicate_service = DuplicateService(
        state_service=state_service,
        vector_store_service=vector_store_service,
    )
    topic_intelligence = TopicIntelligenceService(duplicate_service=duplicate_service, state_service=state_service)
    validation_service = ValidationService()
    topic_service = TopicService()

    quiz_service = QuizService(ai_service=ai_service, prompt_service=prompt_service)
    flashcard_service = FlashcardService(ai_service=ai_service, prompt_service=prompt_service)
    interview_service = InterviewService(
        ai_service=ai_service,
        prompt_service=prompt_service,
        vector_store_service=vector_store_service,
    )
    course_service = CourseService(
        ai_service=ai_service,
        prompt_service=prompt_service,
        vector_store_service=vector_store_service,
    )
    article_rag_service = ArticleRAGService(ai_service=ai_service, prompt_service=prompt_service)

    knowledge_dir = ROOT_DIR / "knowledge"

    # Handle Almanac v2 Course Generation CLI
    if args.generate_course:
        course = course_service.generate_course(
            topic=args.generate_course,
            level=args.course_level,
            goal=args.course_goal,
            time_commitment=args.course_time,
        )
        print(json.dumps(course, indent=2))
        return

    # Handle Almanac v2 Interview Plan Generation CLI
    if args.generate_interview_plan:
        plan = interview_service.generate_interview_plan(
            role=args.generate_interview_plan,
            experience_level=args.interview_exp,
            focus=args.interview_focus,
            company=args.interview_company,
        )
        print(json.dumps(plan, indent=2))
        return

    # Handle Almanac v2 Interview Answer Evaluation CLI
    if args.evaluate_interview_answer:
        eval_result = interview_service.evaluate_answer(
            question=args.question or "Technical Interview Question",
            model_answer=args.model_answer or "",
            user_answer=args.user_answer or "",
            role=args.category or "Backend Software Engineer",
        )
        print(json.dumps(eval_result, indent=2))
        return

    # Handle Almanac v2 Manual User Note Generation CLI
    if args.generate_note:
        handle_generate_note(
            topic_title=args.generate_note,
            category=args.category,
            duplicate_service=duplicate_service,
            article_service=ArticleService(ai_service=ai_service, prompt_service=prompt_service),
            validation_service=validation_service,
            state_service=state_service,
            vector_store_service=vector_store_service,
            retrieval_service=retrieval_service,
            model=args.model,
            force=args.force,
            no_git=args.no_git,
        )
        return


    # Handle Interactive Learning CLI modes
    if args.quiz:
        handle_quiz(quiz_service, knowledge_dir, args.quiz)
        return

    if args.flashcards:
        handle_flashcards(flashcard_service, knowledge_dir, args.flashcards)
        return

    if args.interview:
        handle_interview(interview_service, knowledge_dir, args.interview)
        return

    if args.ask_article:
        handle_ask_article(article_rag_service, knowledge_dir, args.ask_article, args.question)
        return

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

    article_service = ArticleService(
        ai_service=ai_service,
        prompt_service=prompt_service,
    )

    # 4. Generate Article
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