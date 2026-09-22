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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Hero Header */}
      <div className="border-b border-[var(--border)] pb-8">
        <span className="inline-block rounded-full bg-[var(--surface-muted)] px-3.5 py-1 text-xs font-semibold text-[var(--accent)]">
          Interactive Learning Pathways
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
          Engineering Courses & Track Hub
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-[var(--muted)]">
          Curated learning pathways designed to take you from foundational concepts to production-grade engineering architecture. Each track includes interactive AI quizzes, flashcards, and system design drills.
        </p>
      </div>

      {/* Course Track Grid */}
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {COURSE_TRACKS.map((track) => {
          const trackNotes = allNotes.filter(
            (note) => note.category === track.category || track.modules.some((m) => note.title.includes(m))
          );

          return (
            <div
              key={track.id}
              className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:border-[var(--border-strong)] hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-4">
                  <CategoryBadge>{track.category.toUpperCase()}</CategoryBadge>
                  <div className="flex items-center gap-3 text-xs font-medium text-[var(--muted)]">
                    <span>⏱️ {track.duration}</span>
                    <span>•</span>
                    <span>🎯 {track.level}</span>
                  </div>
                </div>

                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                  {track.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  {track.description}
                </p>

                {/* Modules list */}
                <div className="mt-6 border-t border-[var(--border)] pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Included Modules ({trackNotes.length > 0 ? trackNotes.length : track.modules.length})
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {(trackNotes.length > 0 ? trackNotes : track.modules.map(m => ({ title: m, slug: null }))).map(
                      (item, idx) => (
                        <li key={idx} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-[var(--foreground)] truncate">
                            {idx + 1}. {item.title}
                          </span>
                          {item.slug ? (
                            <Link
                              href={`/notes/${item.slug}`}
                              className="shrink-0 text-xs font-semibold text-[var(--accent)] hover:underline"
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

              <div className="mt-8 flex items-center gap-3 border-t border-[var(--border)] pt-5">
                {trackNotes.length > 0 ? (
                  <Link
                    href={`/notes/${trackNotes[0].slug}`}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-[var(--foreground)] px-5 text-sm font-semibold text-[var(--background)] transition hover:opacity-90"
                  >
                    Start Track →
                  </Link>
                ) : (
                  <Link
                    href="/notes"
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-5 text-sm font-semibold text-[var(--foreground)]"
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
      <div className="mt-16 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-8">
        <h2 className="text-xl font-semibold tracking-tight">Browse by Category Topics</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Select a category to jump directly into filtered notes, quizzes, and practice drills.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/notes?category=${cat.slug}`}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
            >
              <span>{cat.label}</span>
              <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-xs text-[var(--muted)]">
                {cat.count}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
