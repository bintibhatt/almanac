import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import NoteCard from "@/components/NoteCard";
import SearchBar from "@/components/SearchBar";
import { getCategories, getLatestNotes } from "@/lib/notes";
import { formatDate, pluralize } from "@/utils/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Home() {
  const latestNotes = getLatestNotes(7);
  const [featured, ...notes] = latestNotes;
  const categories = getCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8 space-y-20">
      {/* Unboxed Minimal Hero Section */}
      <section className="relative pt-4 space-y-10">
        <div className="max-w-3xl space-y-6">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-mono text-[var(--muted)] backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            <span>Almanac v2.0 • Engineering Library & AI Companion</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl text-[var(--foreground)] leading-[1.08]">
            Master Engineering <br />
            <span className="text-[var(--accent)] font-normal">
              Systems & Architecture
            </span>
          </h1>

          {/* Description */}
          <p className="text-base text-[var(--muted)] sm:text-lg leading-relaxed max-w-2xl">
            Deep technical guides, interactive concept flashcards, AI mock interviews, and system design case studies curated for software engineers and architects.
          </p>

          {/* Search Bar */}
          <div className="pt-2 max-w-xl">
            <SearchBar />
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/notes"
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--accent)] px-5 text-xs font-semibold text-white transition-opacity hover:opacity-90 shadow-sm"
            >
              <span>Explore Notes</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            <Link
              href="/interview"
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-5 text-xs font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
            >
              <svg className="h-4 w-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Practice Interview AI</span>
            </Link>
          </div>
        </div>

        {/* Unboxed Stat Counter Row */}
        <div className="grid grid-cols-2 gap-6 border-y border-[var(--border)] py-8 sm:grid-cols-4">
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-[var(--foreground)] font-mono">{latestNotes.length}+</div>
            <div className="text-xs text-[var(--muted)]">Technical Notes</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-[var(--foreground)] font-mono">{categories.length}</div>
            <div className="text-xs text-[var(--muted)]">Domain Categories</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-[var(--foreground)] font-mono">100%</div>
            <div className="text-xs text-[var(--muted)]">Interactive AI Practice</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-[var(--foreground)] font-mono">PWA</div>
            <div className="text-xs text-[var(--muted)]">Offline Reader Shell</div>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Row ("Why Almanac?") */}
      <section className="space-y-8">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-widest text-[var(--accent)]">Capabilities</span>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-3xl">
            Built for Engineering Mastery
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md transition-all hover:border-[var(--border-strong)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--accent)]">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">Engineering Notes</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Curated markdown guides on system design, distributed locks, vector search, and container memory isolation.
            </p>
          </div>

          <div className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md transition-all hover:border-[var(--border-strong)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--accent)]">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">Concept Flashcards</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Master core concepts through interactive spaced-repetition card decks generated directly from note contents.
            </p>
          </div>

          <div className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md transition-all hover:border-[var(--border-strong)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--accent)]">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">AI Interview Drills</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Simulate Staff & Senior technical interviews with architectural problem solving, model solutions, and probes.
            </p>
          </div>

          <div className="space-y-3 rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md transition-all hover:border-[var(--border-strong)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--accent)]">
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">Progress Analytics</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Track reading streaks, quiz mastery scores, and domain completion breakdown in your dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Today's Read Banner */}
      {featured && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--muted)]">
              Featured Guide
            </h2>
          </div>
          <NoteCard note={featured} featured />
        </section>
      )}

      {/* Latest Notes Section */}
      <section className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-3xl">
              Latest Technical Notes
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Recently published guides, architecture breakdowns, and cheat sheets.
            </p>
          </div>
          <Link
            href="/notes"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline transition-all"
          >
            Explore all notes →
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard key={note.slug} note={note} />
          ))}
        </div>
      </section>

      {/* Grid Section: Categories & Activity Feed */}
      <section className="grid gap-10 border-t border-[var(--border)] pt-12 lg:grid-cols-[1fr_1fr]">
        {/* Browse Categories */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
              Browse Knowledge Domains
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Filter by topic area to focus your study sessions.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/notes?category=${category.slug}`}
                className="group flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 transition-all duration-150 hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]"
              >
                <div>
                  <CategoryBadge>{category.label}</CategoryBadge>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {pluralize(category.count, "note")} available
                  </p>
                </div>
                <svg className="h-4 w-4 text-[var(--muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity Stream */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
              Recent Library Updates
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Chronological log of recent additions.
            </p>
          </div>

          <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {latestNotes.slice(0, 5).map((note) => (
              <Link
                href={`/notes/${note.slug}`}
                key={note.slug}
                className="block py-4 transition-colors hover:bg-[var(--surface-hover)] px-2 rounded-md"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-sm text-[var(--foreground)] line-clamp-1">
                    {note.title}
                  </p>
                  <time
                    className="shrink-0 text-xs font-mono text-[var(--muted)]"
                    dateTime={note.published}
                  >
                    {formatDate(note.published, {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-[var(--muted)]">
                  <span className="text-[var(--accent)] font-medium">{note.categoryLabel}</span>
                  <span className="font-mono opacity-80">{note.readingTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}








