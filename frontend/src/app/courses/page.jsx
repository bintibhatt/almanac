import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import { getCategories, getAllNotes } from "@/lib/notes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Courses & Learning Paths | Almanac",
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
    modules: ["Load Balancers - Design Patterns"],
  },
  {
    id: "backend-isolation",
    title: "Backend Performance & Container Isolation",
    category: "backend",
    description: "Deep-dive into Linux cgroups v2, Docker memory limits, cgroups memory swap management, and caching patterns.",
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 space-y-12">
      {/* Hero Header */}
      <div className="space-y-2 border-b border-white/10 pb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
          Learning Pathways
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
          Engineering Courses <br />
          <span className="gradient-text font-normal">& Track Hub</span>
        </h1>
        <p className="text-xs sm:text-base text-slate-400 leading-relaxed max-w-3xl">
          Curated learning pathways designed to take you from foundational concepts to production-grade engineering architecture. Each track includes interactive AI quizzes, flashcards, and system design drills.
        </p>
      </div>

      {/* Course Track Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {COURSE_TRACKS.map((track) => {
          const trackNotes = allNotes.filter(
            (note) => note.category === track.category || track.modules.some((m) => note.title.includes(m))
          );

          return (
            <div
              key={track.id}
              className="group relative flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md transition-all duration-200 hover:bg-white/[0.04] hover:border-white/20"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CategoryBadge>{track.category.toUpperCase()}</CategoryBadge>
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <span>{track.duration}</span>
                    <span>•</span>
                    <span>{track.level}</span>
                  </div>
                </div>

                <h2 className="mt-4 text-xl font-bold tracking-tight text-white transition-colors group-hover:text-white/90">
                  {track.title}
                </h2>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-400">
                  {track.description}
                </p>

                {/* Modules list */}
                <div className="mt-6 border-t border-white/10 pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                      Included Modules
                    </h3>
                    <span className="text-xs font-mono text-zinc-400">
                      {trackNotes.length > 0 ? trackNotes.length : track.modules.length} Notes
                    </span>
                  </div>
                  
                  <ul className="space-y-2">
                    {(trackNotes.length > 0 ? trackNotes : track.modules.map(m => ({ title: m, slug: null }))).map(
                      (item, idx) => (
                        <li key={idx} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3 px-3.5 text-xs">
                          <span className="font-medium text-zinc-200 truncate pr-2">
                            <span className="text-zinc-500 font-mono mr-2">0{idx + 1}.</span> {item.title}
                          </span>
                          {item.slug ? (
                            <Link
                              href={`/notes/${item.slug}`}
                              className="shrink-0 font-medium text-zinc-300 hover:text-white transition-colors"
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

              <div className="mt-8 border-t border-white/10 pt-5">
                {trackNotes.length > 0 ? (
                  <Link
                    href={`/notes/${trackNotes[0].slug}`}
                    className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-white text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
                  >
                    <span>Start Learning Track</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                ) : (
                  <Link
                    href="/notes"
                    className="flex min-h-10 w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-white transition hover:bg-white/10"
                  >
                    Browse Track Notes
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Overview Footer */}
      <div className="space-y-4 border-t border-white/10 pt-10">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Browse by Category Topics</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Select a category to jump directly into filtered notes, quizzes, and practice drills.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-2">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/notes?category=${cat.slug}`}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.04] hover:border-white/20"
            >
              <span>{cat.label}</span>
              <span className="font-mono text-[11px] text-zinc-500">
                {cat.count}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


