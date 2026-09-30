import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import SearchBar from "@/components/SearchBar";
import { getCategories, getLatestNotes } from "@/lib/notes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Home() {
  const latestNotes = getLatestNotes(7);
  const todaysRead = latestNotes[0];
  const continueReading = latestNotes.slice(1, 5);
  const categories = getCategories();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-16">
      {/* 1. Concise Purpose-Driven Header */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-400" />
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            Autonomous Knowledge Base
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-100">
          Almanac<span className="text-violet-400">.</span>
        </h1>
        <p className="text-base text-zinc-400 max-w-xl">
          Engineering knowledge that grows every day. High-signal system architecture, backend patterns, and AI systems documentation.
        </p>

        <div className="pt-2 max-w-lg">
          <SearchBar />
        </div>
      </section>

      {/* 2. Today's Read */}
      {todaysRead && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Today&apos;s Read
            </h2>
            <span className="text-xs text-zinc-500 font-mono">Curated Daily</span>
          </div>

          <Link
            href={`/notes/${todaysRead.slug}`}
            className="group block p-6 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-xl transition"
          >
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <CategoryBadge category={todaysRead.category} label={todaysRead.categoryLabel} />
              <span className="text-xs text-zinc-500 font-mono">{todaysRead.readingTime}</span>
              <span className="text-xs text-zinc-500 capitalize">• {todaysRead.difficulty}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-zinc-100 group-hover:text-violet-400 transition-colors mb-2">
              {todaysRead.title}
            </h3>
            <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed mb-4">
              {todaysRead.description}
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 group-hover:text-violet-300">
              <span>Read article</span>
              <span>→</span>
            </div>
          </Link>
        </section>
      )}

      {/* 3. Continue Reading / Recent Notes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Recent Notes
          </h2>
          <Link href="/notes" className="text-xs text-violet-400 hover:text-violet-300">
            Browse all ({latestNotes.length > 0 ? "20+" : "0"}) →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {continueReading.map((note) => (
            <Link
              key={note.slug}
              href={`/notes/${note.slug}`}
              className="group flex flex-col justify-between p-5 bg-zinc-900/30 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 rounded-lg transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <CategoryBadge category={note.category} label={note.categoryLabel} />
                  <span className="text-xs text-zinc-500 font-mono">{note.readingTime}</span>
                </div>
                <h3 className="text-base font-medium text-zinc-100 group-hover:text-violet-400 transition-colors line-clamp-1 mb-1.5">
                  {note.title}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {note.description}
                </p>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-3 mt-3 border-t border-zinc-800/50">
                <span className="capitalize">{note.difficulty}</span>
                <span>{new Date(note.published).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Explore the Library */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Explore the Library
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/search?category=${cat.slug}`}
              className="group p-4 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-lg transition flex items-center justify-between"
            >
              <div>
                <h3 className="text-sm font-medium text-zinc-200 group-hover:text-violet-400 transition">
                  {cat.label}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {cat.count} {cat.count === 1 ? "article" : "articles"}
                </p>
              </div>
              <span className="text-zinc-600 group-hover:text-violet-400 transition">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Learn With Almanac */}
      <section className="space-y-4 border-t border-zinc-800/80 pt-12">
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Learn With Almanac
          </h2>
          <p className="text-xs text-zinc-500">
            Active recall, comprehension testing, and architectural interview drills built into every guide.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-lg">
            <div className="w-7 h-7 rounded bg-violet-950/60 border border-violet-800/50 flex items-center justify-center text-violet-400 mb-3 text-xs font-mono">
              AI
            </div>
            <h3 className="text-sm font-medium text-zinc-200 mb-1">Ask Article Assistant</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Targeted contextual Q&amp;A referencing the exact architectural note you are studying.
            </p>
          </div>

          <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-lg">
            <div className="w-7 h-7 rounded bg-violet-950/60 border border-violet-800/50 flex items-center justify-center text-violet-400 mb-3 text-xs font-mono">
              FC
            </div>
            <h3 className="text-sm font-medium text-zinc-200 mb-1">Concept Flashcards</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Spaced repetition card decks with interactive flip mechanics for fast concept reinforcement.
            </p>
          </div>

          <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-lg">
            <div className="w-7 h-7 rounded bg-violet-950/60 border border-violet-800/50 flex items-center justify-center text-violet-400 mb-3 text-xs font-mono">
              QZ
            </div>
            <h3 className="text-sm font-medium text-zinc-200 mb-1">Recall Quizzes</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Multi-choice technical evaluations with immediate feedback explanations and score tracking.
            </p>
          </div>

          <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-lg">
            <div className="w-7 h-7 rounded bg-violet-950/60 border border-violet-800/50 flex items-center justify-center text-violet-400 mb-3 text-xs font-mono">
              SD
            </div>
            <h3 className="text-sm font-medium text-zinc-200 mb-1">Interview Drills</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Staff-level design trade-off questions, model solutions, and deep follow-up probes.
            </p>
          </div>
        </div>
      </section>

      {/* 6. What's New Teaser */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-zinc-900/30 border border-zinc-800/80 rounded-lg">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
              SHIPPED
            </span>
            <h3 className="text-sm font-medium text-zinc-200">
              Dense Vector Semantic Search &amp; Precomputed Embeddings
            </h3>
          </div>
          <p className="text-xs text-zinc-500">
            Articles now feature vector-similarity recommendations powered by BAAI/bge-small-en-v1.5 embeddings.
          </p>
        </div>
        <Link
          href="/updates"
          className="shrink-0 text-xs text-violet-400 hover:text-violet-300 font-medium inline-flex items-center gap-1"
        >
          View Roadmap →
        </Link>
      </section>
    </div>
  );
}
