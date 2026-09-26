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
      {/* Unboxed Search Header */}
      <section className="space-y-4 border-b border-slate-800/80 pb-8">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-sky-400">
            Knowledge Search
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Search Engineering Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
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
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              {results.length ? "Search Results" : "No Results Found"}
            </h2>
            <p className="text-xs font-mono text-sky-400">
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
            <div className="rounded-md border border-slate-800 bg-slate-900/50 p-8 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-sky-500/20 bg-sky-500/10 text-base">
                <svg className="h-6 w-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-white">No matching engineering notes</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                Try searching for keywords like <span className="text-sky-400 font-medium">system design</span>, <span className="text-sky-400 font-medium">caching</span>, <span className="text-sky-400 font-medium">docker</span>, or <span className="text-sky-400 font-medium">rag</span>.
              </p>
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Recommended Recent Reads</h2>
            <Link
              href="/notes"
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
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



