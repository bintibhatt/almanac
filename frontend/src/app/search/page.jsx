import Link from "next/link";
import NoteCard from "@/components/NoteCard";
import SearchBar from "@/components/SearchBar";
import { getLatestNotes, searchNotes } from "@/lib/notes";

export const metadata = {
  title: "Search",
  description: "Search engineering notes in Almanac.",
};

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = typeof params?.q === "string" ? params.q.trim() : "";
  const results = searchNotes(query);
  const suggestions = getLatestNotes(3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
      <section className="border-b border-[var(--border)] pb-8">
        <p className="text-sm font-medium text-[var(--accent)]">Search</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Find a note
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Search titles, descriptions, categories, tags, and note content.
        </p>
        <div className="mt-6 max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <SearchBar defaultValue={query} />
        </div>
      </section>

      {query ? (
        <section className="py-8 lg:py-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {results.length ? "Results" : "No results"}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {results.length
                  ? `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"`
                  : `Nothing matched "${query}". Try a broader term or category name.`}
              </p>
            </div>
          </div>

          {results.length ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((note) => (
                <NoteCard key={note.slug} note={note} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="text-sm leading-6 text-[var(--muted)]">
                Search works best with concrete terms like database, redis,
                vector, backend, design, or frontend.
              </p>
            </div>
          )}
        </section>
      ) : (
        <section className="py-8 lg:py-10">
          <h2 className="text-2xl font-semibold tracking-tight">Start with recent notes</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((note) => (
              <NoteCard key={note.slug} note={note} />
            ))}
          </div>
          <Link
            href="/notes"
            className="mt-6 inline-flex min-h-11 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
          >
            Browse all notes
          </Link>
        </section>
      )}
    </div>
  );
}
