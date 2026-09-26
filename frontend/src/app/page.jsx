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
      <section className="relative overflow-hidden rounded-[2.5rem] border border-[var(--border)] bg-gradient-to-b from-[var(--surface)] via-[var(--surface-solid)] to-[var(--background)] p-8 sm:p-12 lg:p-14 shadow-2xl backdrop-blur-2xl">
        {/* Glow ambient background circles */}
        <div className="absolute -top-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          {/* Left Hero Content */}
          <div className="space-y-6">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-bold text-sky-400 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-ping" />
              <span>Almanac v2.0 • Living Engineering Library & AI Companion</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl text-[var(--foreground)] leading-[1.1]">
              Master Engineering <br />
              <span className="gradient-text">Concepts & Systems</span>
            </h1>

            {/* Description */}
            <p className="text-base text-[var(--muted)] sm:text-lg leading-relaxed max-w-xl">
              Deep-dive technical guides, interactive spaced-repetition flashcards, AI mock interviews, and system design case studies curated for software engineers and architects.
            </p>

            {/* Search Bar Container */}
            <div className="pt-2 max-w-xl">
              <SearchBar />
            </div>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/notes"
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 px-6 text-sm font-bold text-white shadow-xl shadow-sky-500/20 transition-all duration-300 hover:scale-[1.02] hover:opacity-95"
              >
                <span>Explore Notes</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>

              <Link
                href="/interview"
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 text-sm font-bold text-[var(--foreground)] backdrop-blur-md transition-all duration-300 hover:border-purple-500/40 hover:bg-[var(--surface-hover)]"
              >
                <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Practice Interview AI</span>
              </Link>
            </div>
          </div>

          {/* Right Hero System Overview Panel */}
          <div className="relative overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-gradient-to-br from-[var(--surface-solid)] to-[var(--background-alt)] p-6 shadow-2xl backdrop-blur-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-[var(--muted)]">almanac.engine.v2.0</span>
            </div>

            {/* Simulated Live Architecture Services */}
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-sky-400">Vector Search Indexing</div>
                    <div className="text-[11px] text-[var(--muted)]">Hybrid BM25 + HNSW dense search</div>
                  </div>
                </div>
                <span className="rounded-full bg-sky-400/20 px-2.5 py-1 text-[10px] font-bold text-sky-400">ONLINE</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-400">Spaced Repetition Engine</div>
                    <div className="text-[11px] text-[var(--muted)]">Adaptive concept recall active</div>
                  </div>
                </div>
                <span className="rounded-full bg-indigo-400/20 px-2.5 py-1 text-[10px] font-bold text-indigo-400">READY</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-400">System Design Mock AI</div>
                    <div className="text-[11px] text-[var(--muted)]">Staff level architectural feedback</div>
                  </div>
                </div>
                <span className="rounded-full bg-purple-400/20 px-2.5 py-1 text-[10px] font-bold text-purple-400">ACTIVE</span>
              </div>
            </div>

            {/* Mini Footer Stat */}
            <div className="flex items-center justify-between pt-2 text-xs font-semibold text-[var(--muted)] border-t border-[var(--border)]">
              <span>All 14 Notes Synced</span>
              <span className="text-emerald-400">Offline PWA Ready</span>
            </div>
          </div>
        </div>

        {/* Hero Stats Counter Bar */}
        <div className="mt-12 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-8 sm:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center backdrop-blur-md">
            <div className="text-3xl font-black text-sky-400">{latestNotes.length}+</div>
            <div className="text-xs font-bold text-[var(--muted)] mt-1">Technical Notes</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center backdrop-blur-md">
            <div className="text-3xl font-black text-indigo-400">{categories.length}</div>
            <div className="text-xs font-bold text-[var(--muted)] mt-1">Domain Categories</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center backdrop-blur-md">
            <div className="text-3xl font-black text-emerald-400">100%</div>
            <div className="text-xs font-bold text-[var(--muted)] mt-1">Interactive AI Practice</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center backdrop-blur-md">
            <div className="text-3xl font-black text-purple-400">PWA</div>
            <div className="text-xs font-bold text-[var(--muted)] mt-1">Offline Reader Shell</div>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Grid ("Why Almanac?") */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Core Features</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            Built for Modern Engineering Mastery
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Everything you need to study, revise, and excel in senior engineering roles.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-xl space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/10 text-sky-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)]">Engineering Notes</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Curated markdown guides on system design, distributed locks, vector search, and container memory isolation.
            </p>
          </div>

          <div className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-xl space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)]">3D Concept Flashcards</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Master core concepts through interactive spaced-repetition card decks generated directly from note contents.
            </p>
          </div>

          <div className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-xl space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)]">AI Interview Drills</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Simulate Staff & Senior technical interviews with architectural problem solving, model solutions, and probes.
            </p>
          </div>

          <div className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)]">Progress Analytics</h3>
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
            <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              Today&apos;s Featured Read
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
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:underline"
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
            <p className="mt-1 text-sm text-[var(--muted)]">
              Filter by topic area to focus your study sessions.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/notes?category=${category.slug}`}
                className="group relative flex flex-col justify-between rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <CategoryBadge>{category.label}</CategoryBadge>
                  <svg className="h-4 w-4 text-[var(--muted)] transition-transform group-hover:translate-x-1 group-hover:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="mt-5 text-xs font-bold text-[var(--muted)]">
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
            <p className="mt-1 text-sm text-[var(--muted)]">
              Chronological log of recent additions.
            </p>
          </div>

          <div className="divide-y divide-[var(--border)] rounded-3xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl overflow-hidden">
            {latestNotes.slice(0, 5).map((note) => (
              <Link
                href={`/notes/${note.slug}`}
                key={note.slug}
                className="block p-5 transition-colors hover:bg-[var(--surface-hover)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-bold text-sm text-[var(--foreground)] line-clamp-1">
                    {note.title}
                  </p>
                  <time
                    className="shrink-0 text-xs font-semibold text-[var(--muted)]"
                    dateTime={note.published}
                  >
                    {formatDate(note.published, {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{note.categoryLabel}</span>
                  <span className="text-sky-400 font-bold">{note.readingTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}






