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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 space-y-16">
      {/* SaaS Split Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-12 lg:p-14 backdrop-blur-2xl transition-all duration-300">
        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Left Hero Content */}
          <div className="space-y-6">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-muted)] px-3.5 py-1 text-xs font-semibold text-[var(--muted-light)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              <span>Almanac v2.0 • Living Engineering Library & AI Companion</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-[var(--foreground)] leading-[1.1]">
              Master Engineering <br />
              <span className="gradient-text">Concepts & Systems</span>
            </h1>

            {/* Description */}
            <p className="text-sm text-[var(--muted)] sm:text-base leading-relaxed max-w-xl">
              Deep technical guides, interactive spaced-repetition flashcards, AI mock interviews, and system design case studies curated for software engineers and architects.
            </p>

            {/* Search Bar Container */}
            <div className="pt-2 max-w-xl">
              <SearchBar />
            </div>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/notes"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--foreground)] px-5 text-xs font-semibold text-[var(--background)] shadow-sm transition-all duration-200 hover:opacity-90"
              >
                <span>Explore Notes</span>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>

              <Link
                href="/interview"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-5 text-xs font-semibold text-[var(--foreground)] transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
              >
                <svg className="h-3.5 w-3.5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Practice Interview AI</span>
              </Link>
            </div>
          </div>

          {/* Right Hero System Overview Panel */}
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-6 shadow-xl backdrop-blur-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--border-strong)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--border-strong)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--border-strong)]" />
              </div>
              <span className="text-[11px] font-mono text-[var(--muted)]">almanac.engine.v2.0</span>
            </div>

            {/* Architecture Services List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-solid)] text-[var(--foreground)]">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--foreground)]">Vector Search Indexing</div>
                    <div className="text-[11px] text-[var(--muted)]">Hybrid BM25 + HNSW dense retrieval</div>
                  </div>
                </div>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-2.5 py-0.5 text-[10px] font-mono text-[var(--muted-light)]">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-solid)] text-[var(--foreground)]">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--foreground)]">Spaced Repetition Engine</div>
                    <div className="text-[11px] text-[var(--muted)]">Adaptive memory card generator</div>
                  </div>
                </div>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-2.5 py-0.5 text-[10px] font-mono text-[var(--muted-light)]">READY</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-solid)] text-[var(--foreground)]">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--foreground)]">Mock Interview Drills</div>
                    <div className="text-[11px] text-[var(--muted)]">Architectural problem evaluation</div>
                  </div>
                </div>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-2.5 py-0.5 text-[10px] font-mono text-[var(--muted-light)]">ONLINE</span>
              </div>
            </div>

            {/* Mini Footer Stat */}
            <div className="flex items-center justify-between pt-2 text-[11px] font-medium text-[var(--muted)] border-t border-[var(--border)]">
              <span>All 14 Notes Synced</span>
              <span className="text-[var(--foreground)] font-mono">Offline PWA Enabled</span>
            </div>
          </div>
        </div>

        {/* Hero Stats Counter Bar */}
        <div className="mt-12 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-8 sm:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">{latestNotes.length}+</div>
            <div className="text-xs font-medium text-[var(--muted)] mt-1">Technical Notes</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">{categories.length}</div>
            <div className="text-xs font-medium text-[var(--muted)] mt-1">Domain Categories</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">100%</div>
            <div className="text-xs font-medium text-[var(--muted)] mt-1">Interactive Drills</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-center">
            <div className="text-2xl font-bold text-[var(--foreground)]">PWA</div>
            <div className="text-xs font-medium text-[var(--muted)] mt-1">Offline Reader Shell</div>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Grid ("Why Almanac?") */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">Core Capabilities</span>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-3xl">
            Built for Modern Engineering Mastery
          </h2>
          <p className="text-xs text-[var(--muted)] sm:text-sm">
            Everything you need to study, revise, and excel in senior engineering roles.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] text-[var(--foreground)]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[var(--foreground)]">Engineering Notes</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Curated guides on system design, distributed locks, vector search, and container memory isolation.
            </p>
          </div>

          <div className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] text-[var(--foreground)]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[var(--foreground)]">Concept Flashcards</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Master core concepts through interactive spaced-repetition card decks generated directly from note content.
            </p>
          </div>

          <div className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] text-[var(--foreground)]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[var(--foreground)]">AI Interview Drills</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Simulate Staff & Senior technical interviews with architectural problem solving, model solutions, and probes.
            </p>
          </div>

          <div className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] space-y-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] text-[var(--foreground)]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[var(--foreground)]">Progress Analytics</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Track reading streak history, quiz mastery scores, and domain completion breakdown in your dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Today's Read Banner */}
      {featured && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">
              Featured Read
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
            <p className="mt-1 text-xs text-[var(--muted)] sm:text-sm">
              Recently published guides, architecture breakdowns, and cheat sheets.
            </p>
          </div>
          <Link
            href="/notes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
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
      <section className="grid gap-8 border-t border-[var(--border)] pt-12 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Browse Categories */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
              Browse Knowledge Domains
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)] sm:text-sm">
              Filter by topic area to focus your study sessions.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/notes?category=${category.slug}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <CategoryBadge>{category.label}</CategoryBadge>
                  <svg className="h-4 w-4 text-[var(--muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="mt-5 text-xs font-medium text-[var(--muted)]">
                  {pluralize(category.count, "note")} available
                </p>
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
            <p className="mt-1 text-xs text-[var(--muted)] sm:text-sm">
              Chronological log of recent additions.
            </p>
          </div>

          <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl overflow-hidden">
            {latestNotes.slice(0, 5).map((note) => (
              <Link
                href={`/notes/${note.slug}`}
                key={note.slug}
                className="block p-4 sm:p-5 transition-colors hover:bg-[var(--surface-hover)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-bold text-xs sm:text-sm text-[var(--foreground)] line-clamp-1">
                    {note.title}
                  </p>
                  <time
                    className="shrink-0 text-[11px] font-medium text-[var(--muted)]"
                    dateTime={note.published}
                  >
                    {formatDate(note.published, {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--muted)]">
                  <span>{note.categoryLabel}</span>
                  <span className="font-medium text-[var(--foreground)]">{note.readingTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}





