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
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-12 backdrop-blur-2xl">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-bold text-indigo-400">
            <span>🎓 Interactive Learning Pathways</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-[var(--foreground)]">
            Engineering Courses <br />
            <span className="gradient-text">& Track Hub</span>
          </h1>
          <p className="text-base text-[var(--muted)] sm:text-lg leading-relaxed">
            Curated learning pathways designed to take you from foundational concepts to production-grade engineering architecture. Each track includes interactive AI quizzes, flashcards, and system design drills.
          </p>
        </div>
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
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-2xl hover:shadow-indigo-500/10"
            >
              {/* Top Accent Line */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 opacity-80" />

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CategoryBadge>{track.category.toUpperCase()}</CategoryBadge>
                  <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                    <span>⏱️ {track.duration}</span>
                    <span>•</span>
                    <span className="text-sky-400">🎯 {track.level}</span>
                  </div>
                </div>

                <h2 className="mt-5 text-2xl font-bold tracking-tight text-[var(--foreground)] transition-colors group-hover:text-sky-400">
                  {track.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  {track.description}
                </p>

                {/* Modules list */}
                <div className="mt-6 border-t border-[var(--border)] pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      Included Modules
                    </h3>
                    <span className="text-xs font-semibold text-sky-400">
                      {trackNotes.length > 0 ? trackNotes.length : track.modules.length} Notes
                    </span>
                  </div>
                  
                  <ul className="space-y-2.5">
                    {(trackNotes.length > 0 ? trackNotes : track.modules.map(m => ({ title: m, slug: null }))).map(
                      (item, idx) => (
                        <li key={idx} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-xs">
                          <span className="font-semibold text-[var(--foreground)] truncate pr-2">
                            <span className="text-sky-400 mr-2">0{idx + 1}.</span> {item.title}
                          </span>
                          {item.slug ? (
                            <Link
                              href={`/notes/${item.slug}`}
                              className="shrink-0 font-bold text-sky-400 hover:underline"
                            >
                              Study Note →
                            </Link>
                          ) : (
                            <span className="text-xs text-[var(--muted)]">In Library</span>
                          )}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>

              <div className="mt-8 border-t border-[var(--border)] pt-6">
                {trackNotes.length > 0 ? (
                  <Link
                    href={`/notes/${trackNotes[0].slug}`}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:opacity-95"
                  >
                    <span>Start Learning Track</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                ) : (
                  <Link
                    href="/notes"
                    className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
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
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 backdrop-blur-xl">
        <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Browse by Category Topics</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Select a category to jump directly into filtered notes, quizzes, and practice drills.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/notes?category=${cat.slug}`}
              className="inline-flex items-center gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
            >
              <span>{cat.label}</span>
              <span className="rounded-full bg-[var(--surface-solid)] px-2.5 py-0.5 text-xs text-sky-400 border border-[var(--border)]">
                {cat.count}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

