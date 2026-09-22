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
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-12 lg:px-8">
      {featured ? (
        <section className="grid gap-5 border-b border-[var(--border)] pb-8 lg:grid-cols-[0.34fr_1fr] lg:gap-8 lg:pb-12">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Today&apos;s Read
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              The latest note in the library, ready for a focused reading pass.
            </p>
          </div>
          <NoteCard note={featured} featured />
        </section>
      ) : null}

      <section className="grid gap-4 border-b border-[var(--border)] py-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <SearchBar />
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-[var(--surface-muted)] px-3 py-3">
            <div className="text-lg font-semibold">{latestNotes.length}</div>
            <div className="text-xs text-[var(--muted)]">Recent</div>
          </div>
          <div className="rounded-xl bg-[var(--surface-muted)] px-3 py-3">
            <div className="text-lg font-semibold">{categories.length}</div>
            <div className="text-xs text-[var(--muted)]">Topics</div>
          </div>
          {/* <div className="rounded-xl bg-[var(--surface-muted)] px-3 py-3">
            <div className="text-lg font-semibold">PWA</div>
            <div className="text-xs text-[var(--muted)]">Ready</div>
          </div> */}
        </div>
      </section>

      <section className="py-8 lg:py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Latest Notes
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Recent additions from the knowledge base.
            </p>
          </div>
          <Link
            href="/notes"
            className="text-sm font-medium text-[var(--foreground)] underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard key={note.slug} note={note} />
          ))}
        </div>
      </section>

      <section className="grid gap-8 border-t border-[var(--border)] py-8 lg:grid-cols-[1fr_0.9fr] lg:py-12">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Browse Categories
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/notes?category=${category.slug}`}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
              >
                <CategoryBadge>{category.label}</CategoryBadge>
                <p className="mt-4 text-sm text-[var(--muted)]">
                  {pluralize(category.count, "note")}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Recent Activity
          </h2>
          <div className="mt-6 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            {latestNotes.slice(0, 5).map((note) => (
              <Link
                href={`/notes/${note.slug}`}
                key={note.slug}
                className="block min-h-16 p-4 transition hover:bg-[var(--surface-hover)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-[var(--foreground)]">
                    {note.title}
                  </p>
                  <time
                    className="shrink-0 text-xs text-[var(--muted)]"
                    dateTime={note.published}
                  >
                    {formatDate(note.published, {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {note.categoryLabel}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
