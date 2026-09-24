import Link from "next/link";
import NoteCard from "@/components/NoteCard";
import SearchBar from "@/components/SearchBar";
import { getLatestNotes, searchNotes } from "@/lib/notes";

export const metadata = {
  title: "Search Library | Almanac",
  description: "Search engineering notes in Almanac.",
};

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = typeof params?.q === "string" ? params.q.trim() : "";
  const results = searchNotes(query);
  const suggestions = getLatestNotes(3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-12 backdrop-blur-2xl">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-bold text-sky-400">
            <span>🔍 Instant Knowledge Search</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--foreground)]">
            Search Engineering Library
          </h1>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Search titles, descriptions, categories, tags, and note content across all domain guides.
          </p>
          <div className="pt-2">
            <SearchBar defaultValue={query} />
          </div>
        </div>
      </section>

      {query ? (
        <section className="space-y-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
              {results.length ? "Search Results" : "No Results Found"}
            </h2>
            <p className="text-xs font-semibold text-sky-400">
              {results.length
                ? `${results.length} result${results.length === 1 ? "" : "s"} found for "${query}"`
                : `No exact matches for "${query}"`}
            </p>
          </div>

          {results.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((note) => (
                <NoteCard key={note.slug} note={note} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center space-y-3 backdrop-blur-xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] text-xl">
                🔎
              </div>
              <h3 className="text-base font-bold text-[var(--foreground)]">No matching engineering notes</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed max-w-md mx-auto">
                Try searching for keywords like <span className="text-sky-400 font-semibold">system design</span>, <span className="text-sky-400 font-semibold">caching</span>, <span className="text-sky-400 font-semibold">docker</span>, or <span className="text-sky-400 font-semibold">rag</span>.
              </p>
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">Recommended Recent Reads</h2>
            <Link
              href="/notes"
              className="text-xs font-bold text-sky-400 hover:underline"
            >
              Explore all notes →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((note) => (
              <NoteCard key={note.slug} note={note} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

