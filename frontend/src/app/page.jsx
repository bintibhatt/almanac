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
      {/* SaaS Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-[var(--background)] p-8 sm:p-12 lg:p-16 shadow-2xl backdrop-blur-2xl">
        {/* Glow ambient background circles */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold text-sky-400">
            <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-ping" />
            <span>Almanac v2.0 • AI-Powered Living Engineering Library</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-[var(--foreground)] leading-[1.15]">
            Master Engineering <br />
            <span className="gradient-text">Concepts & Architecture</span>
          </h1>

          {/* Description */}
          <p className="text-base text-[var(--muted)] sm:text-lg leading-relaxed max-w-2xl">
            Deep-dive technical guides, interactive spaced-repetition flashcards, AI mock interviews, and system design case studies curated for modern developers.
          </p>

          {/* Search Bar Container */}
          <div className="pt-2 max-w-xl">
            <SearchBar />
          </div>

          {/* Quick Topic Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-[var(--muted)]">
            <span className="font-semibold text-[var(--foreground)]">Popular:</span>
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.slug}
                href={`/notes?category=${cat.slug}`}
                className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]"
              >
                #{cat.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Hero Stats Card Grid */}
        <div className="mt-12 grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-8 sm:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center backdrop-blur-md">
            <div className="text-2xl font-black text-sky-400">{latestNotes.length}+</div>
            <div className="text-xs font-medium text-[var(--muted)]">Technical Notes</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center backdrop-blur-md">
            <div className="text-2xl font-black text-indigo-400">{categories.length}</div>
            <div className="text-xs font-medium text-[var(--muted)]">Core Domain Categories</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center backdrop-blur-md">
            <div className="text-2xl font-black text-emerald-400">100%</div>
            <div className="text-xs font-medium text-[var(--muted)]">Interactive AI Practice</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center backdrop-blur-md">
            <div className="text-2xl font-black text-purple-400">PWA</div>
            <div className="text-xs font-medium text-[var(--muted)]">Offline Ready</div>
          </div>
        </div>
      </section>

      {/* Featured Note Section */}
      {featured && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
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
              Latest Engineering Notes
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Recently published guides, architecture breakdowns, and cheat sheets.
            </p>
          </div>
          <Link
            href="/notes"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] transition hover:underline"
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
              Filter by topic area to focus your reading.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/notes?category=${category.slug}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <CategoryBadge>{category.label}</CategoryBadge>
                  <svg className="h-4 w-4 text-[var(--muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="mt-4 text-xs font-semibold text-[var(--muted)]">
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

          <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl overflow-hidden">
            {latestNotes.slice(0, 5).map((note) => (
              <Link
                href={`/notes/${note.slug}`}
                key={note.slug}
                className="block p-4 transition-colors hover:bg-[var(--surface-hover)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-sm text-[var(--foreground)] line-clamp-1">
                    {note.title}
                  </p>
                  <time
                    className="shrink-0 text-xs font-medium text-[var(--muted)]"
                    dateTime={note.published}
                  >
                    {formatDate(note.published, {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{note.categoryLabel}</span>
                  <span className="text-sky-400 font-medium">{note.readingTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

