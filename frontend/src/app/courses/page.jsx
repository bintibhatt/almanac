import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import { getCategories, getAllNotes } from "@/lib/notes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Courses & Learning Tracks | Almanac",
  description: "Structured engineering learning tracks with AI quizzes, flashcards, and hands-on note deep-dives.",
};

const COURSE_TRACKS = [
  {
    id: "ai-rag",
    title: "AI & RAG Systems Architecture",
    category: "ai",
    description: "Master Retrieval-Augmented Generation, vector embedding indexing, hybrid BM25 + dense search, and context grounding.",
    level: "Advanced",
    duration: "4 hours",
    modules: ["Vector Databases - Architecture", "RAG - Performance Optimization", "RAG - Architecture"],
  },
  {
    id: "system-design",
    title: "Distributed Systems & Scalability",
    category: "system-design",
    description: "Learn load balancing strategies, global state isolation, circuit breakers, and fault-tolerant system design patterns.",
    level: "Intermediate to Advanced",
    duration: "3.5 hours",
    modules: ["Load Balancers - Design Patterns", "Distributed Locks - Performance Optimization"],
  },
  {
    id: "backend-isolation",
    title: "Backend Performance & Container Isolation",
    category: "backend",
    description: "Deep-dive into Linux cgroups v2, Docker memory limits, memory swap management, and caching patterns.",
    level: "Intermediate",
    duration: "3 hours",
    modules: ["Docker Container Memory Isolation", "Caching - Advanced Concepts", "REST API Architecture", "Redis Streams"],
  },
  {
    id: "security-optimization",
    title: "Web Security & Network Optimization",
    category: "security",
    description: "Explore HTTPS TLS 1.3 handshakes, certificate pinning, HSTS headers, and HTTP/2 multiplexing.",
    level: "Intermediate",
    duration: "2.5 hours",
    modules: ["HTTPS - Performance Optimization"],
  },
];

export default function CoursesPage() {
  const allNotes = getAllNotes();
  const categories = getCategories();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Header */}
      <div className="space-y-2 border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-semibold text-zinc-100 tracking-tight">
          Engineering Courses &amp; Tracks
        </h1>
        <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
          Curated learning pathways designed to guide you from core concepts to production architecture. Each track includes interactive AI quizzes, concept flashcards, and system design exercises.
        </p>
      </div>

      {/* Course Track Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {COURSE_TRACKS.map((track) => {
          const trackNotes = allNotes.filter(
            (note) => note.category === track.category || track.modules.some((m) => note.title.includes(m))
          );

          return (
            <div
              key={track.id}
              className="flex flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 hover:border-zinc-700 transition"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CategoryBadge category={track.category}>{track.category.toUpperCase()}</CategoryBadge>
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                    <span>{track.duration}</span>
                    <span>•</span>
                    <span>{track.level}</span>
                  </div>
                </div>

                <h2 className="mt-4 text-lg font-medium tracking-tight text-zinc-100">
                  {track.title}
                </h2>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-400">
                  {track.description}
                </p>

                {/* Modules list */}
                <div className="mt-6 border-t border-zinc-800/80 pt-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
                    <span>INCLUDED MODULES</span>
                    <span>{trackNotes.length > 0 ? trackNotes.length : track.modules.length} Notes</span>
                  </div>

                  <ul className="space-y-1.5">
                    {(trackNotes.length > 0 ? trackNotes : track.modules.map((m) => ({ title: m, slug: null }))).map(
                      (item, idx) => (
                        <li key={idx} className="flex items-center justify-between rounded border border-zinc-800/60 bg-zinc-950/40 p-2.5 text-xs">
                          <span className="font-medium text-zinc-300 truncate pr-2">
                            <span className="text-zinc-500 font-mono mr-2">0{idx + 1}.</span> {item.title}
                          </span>
                          {item.slug ? (
                            <Link
                              href={`/notes/${item.slug}`}
                              className="shrink-0 font-medium text-violet-400 hover:text-violet-300 transition"
                            >
                              Study →
                            </Link>
                          ) : (
                            <span className="text-xs text-zinc-500">In Library</span>
                          )}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800">
                {trackNotes.length > 0 ? (
                  <Link
                    href={`/notes/${trackNotes[0].slug}`}
                    className="flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-violet-600 text-xs font-medium text-white transition hover:bg-violet-500"
                  >
                    <span>Start Track</span>
                    <span>→</span>
                  </Link>
                ) : (
                  <Link
                    href="/notes"
                    className="flex h-9 w-full items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800"
                  >
                    Browse Library Notes
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Overview Footer */}
      <div className="space-y-4 border-t border-zinc-800 pt-8">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Browse by Domain Category
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Jump directly into filtered notes, quizzes, and practice drills.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/notes?category=${cat.slug}`}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              <span>{cat.label}</span>
              <span className="font-mono text-[11px] text-zinc-500">
                ({cat.count})
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
