import Link from "next/link";
import { getLatestNotes } from "@/lib/notes";
import CategoryBadge from "@/components/CategoryBadge";

export const metadata = {
  title: "What's New & Roadmap | Almanac",
  description: "Platform changelog, autonomous ingestion telemetry, recently added articles, and upcoming milestones.",
};

const ROADMAP_ITEMS = [
  {
    status: "SHIPPED",
    statusColor: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    title: "Dense Vector Semantic Similarity & Cosine Cross-Referencing",
    date: "Latest Release",
    description:
      "Integrated fastembed with BAAI/bge-small-en-v1.5 precomputed vector indexing for sub-millisecond semantic similarity note recommendations.",
  },
  {
    status: "SHIPPED",
    statusColor: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    title: "Command Palette & Multi-Word Ranked Search",
    date: "Latest Release",
    description:
      "Dedicated /api/search architecture with multi-word scoring, exact phrase boosting, tag filtering, keyboard shortcuts (/, Cmd+K, arrow keys), and live category pills.",
  },
  {
    status: "SHIPPED",
    statusColor: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    title: "AI Knowledge Suite: Flashcards, Quizzes & Mock System Design",
    date: "Latest Release",
    description:
      "Interactive learning modules per note: 5-card flashcard decks with flip animations, 4-question quizzes with instant explanation feedback, and 3-stage mock interview drills.",
  },
  {
    status: "IN PROGRESS",
    statusColor: "bg-violet-950/60 text-violet-400 border-violet-800/60",
    title: "Custom Curated Learning Paths & Skill Certification",
    date: "Q2 2026",
    description:
      "Structured learning paths with sequential prerequisites, knowledge checkpoints, and verifiable skill completion badges.",
  },
  {
    status: "NEXT",
    statusColor: "bg-blue-950/60 text-blue-400 border-blue-800/60",
    title: "Interactive Architecture Diagrams with Mermaid Live Sandbox",
    date: "Q3 2026",
    description:
      "Live interactive system design canvas rendering distributed topologies, message queues, and consensus flows embedded directly in engineering guides.",
  },
  {
    status: "EXPLORING",
    statusColor: "bg-zinc-800 text-zinc-400 border-zinc-700",
    title: "Autonomous Knowledge Ingestion from ArXiv Systems Papers",
    date: "Future Exploration",
    description:
      "Extending topic extraction to parse recent peer-reviewed systems papers (OSDI, SOSP, NSDI) into production-oriented engineering guides.",
  },
];

export default function UpdatesPage() {
  const latestNotes = getLatestNotes(5);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-zinc-100 tracking-tight mb-2">
          What&apos;s New &amp; Roadmap
        </h1>
        <p className="text-sm text-zinc-400">
          Changelog of recent platform features, latest additions to the knowledge graph, and engineering roadmap.
        </p>
      </div>

      {/* Roadmap & Feature Changelog */}
      <div className="mb-12">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-6">
          Platform Engineering Roadmap
        </h2>
        <div className="space-y-4">
          {ROADMAP_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-lg hover:border-zinc-700 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded border font-mono ${item.statusColor}`}
                  >
                    {item.status}
                  </span>
                  <h3 className="text-sm sm:text-base font-medium text-zinc-100">
                    {item.title}
                  </h3>
                </div>
                <span className="text-xs text-zinc-500 font-mono">{item.date}</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed pl-0 sm:pl-1">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Articles Ingested */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Recently Ingested Knowledge
          </h2>
          <Link href="/notes" className="text-xs text-violet-400 hover:text-violet-300">
            View all in library →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {latestNotes.map((note) => (
            <Link
              key={note.slug}
              href={`/notes/${note.slug}`}
              className="p-4 bg-zinc-900/30 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-lg transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <CategoryBadge category={note.category} label={note.categoryLabel} />
                <span className="text-[11px] text-zinc-500 font-mono">{note.readingTime}</span>
              </div>
              <h3 className="text-sm font-medium text-zinc-100 group-hover:text-violet-400 transition truncate mb-1">
                {note.title}
              </h3>
              <p className="text-xs text-zinc-500 truncate">{note.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
