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
    title: "Almanac v2 Architecture: Global Knowledge & Personal Learning",
    date: "v2.0 Release",
    description:
      "Decoupled global shared knowledge from personal learning engines. Notes remain a shared public library while courses and interview preparations are generated uniquely for individual learning goals.",
  },
  {
    status: "SHIPPED",
    statusColor: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    title: "Intelligent Daily Topic Discovery Flow",
    date: "v2.0 Release",
    description:
      "Replaced random selection with deterministic scoring across GitHub Trending, Hacker News, knowledge gap heuristics, and user requests with duplicate vector suppression.",
  },
  {
    status: "SHIPPED",
    statusColor: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    title: "On-Demand Manual Note Generation",
    date: "v2.0 Release",
    description:
      "Request deep technical notes on any topic directly from the library. Automatic vector duplicate detection guides you to existing notes or researches and compiles new validated knowledge.",
  },
  {
    status: "SHIPPED",
    statusColor: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    title: "Independent Course Curriculum Engine",
    date: "v2.0 Release",
    description:
      "Generate custom, multi-module structured courses with detailed lessons, runnable code blocks, interactive practice exercises, self-assessments, and cross-references to Almanac notes.",
  },
  {
    status: "SHIPPED",
    statusColor: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    title: "Independent Role-Based Interview Preparation",
    date: "v2.0 Release",
    description:
      "Tailor-made interview study plans mapped to engineering roles and difficulty tiers (Junior to Staff), with interactive practice sessions and AI rubric-graded critique.",
  },
  {
    status: "SHIPPED",
    statusColor: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    title: "Local-First Client Storage (IndexedDB almanac_personal_v2)",
    date: "v2.0 Release",
    description:
      "Full offline-first persistence for generated courses, lesson progress, interview plans, practice responses, and telemetry using IndexedDB without requiring account creation.",
  },
  {
    status: "SHIPPED",
    statusColor: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    title: "PWA Service Worker Update Detection",
    date: "v2.0 Release",
    description:
      "Autonomous deploy detection in service worker with a non-intrusive 'New version available' toast and instant cache refresh activation.",
  },
  {
    status: "IN PROGRESS",
    statusColor: "bg-violet-950/60 text-violet-400 border-violet-800/60",
    title: "Web Push Notifications for Daily Note Releases",
    date: "Active",
    description:
      "Opt-in browser push notification integration delivering daily alerts when new validated engineering notes are added to the library.",
  },
  {
    status: "IN PROGRESS",
    statusColor: "bg-violet-950/60 text-violet-400 border-violet-800/60",
    title: "Personal Learning Preferences & Pacing Controls",
    date: "Active",
    description:
      "Granular customization for course pacing, code language preferences (Go, Rust, TypeScript, Python), and interview focus areas.",
  },
  {
    status: "NEXT",
    statusColor: "bg-blue-950/60 text-blue-400 border-blue-800/60",
    title: "AWS Autonomous Ingestion & Background Scheduler",
    date: "Upcoming",
    description:
      "Cloud architecture migration using AWS EventBridge, ECS Fargate / Lambda tasks, and S3 for distributed daily research and validation runs.",
  },
  {
    status: "NEXT",
    statusColor: "bg-blue-950/60 text-blue-400 border-blue-800/60",
    title: "Cloud Backup & Multi-Device Sync for Personal Learning",
    date: "Upcoming",
    description:
      "Encrypted end-to-end cloud sync allowing courses, interview plans, and notes progress to synchronize across devices while preserving local-first speed.",
  },
  {
    status: "EXPLORING",
    statusColor: "bg-zinc-800 text-zinc-400 border-zinc-700",
    title: "Autonomous Knowledge Ingestion from ArXiv Systems Papers",
    date: "Research",
    description:
      "Extending topic extraction to parse recent peer-reviewed systems papers (OSDI, SOSP, NSDI) into production-oriented engineering guides.",
  },
  {
    status: "EXPLORING",
    statusColor: "bg-zinc-800 text-zinc-400 border-zinc-700",
    title: "Learning Activity Streaks & Spaced Repetition Reminders",
    date: "Research",
    description:
      "Telemetry-backed spaced repetition schedule prompting recall tests on previously learned concepts to solidify long-term retention.",
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
