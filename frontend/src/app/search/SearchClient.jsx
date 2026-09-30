"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";

export default function SearchClient({ initialQuery = "", initialCategory = "all", categories = [], allNotes = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  // Sync state when URL params change externally
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const cat = searchParams.get("category") || "all";
    setQuery(q);
    setSelectedCategory(cat);
  }, [searchParams]);

  // Update URL params smoothly
  const updateUrl = (newQuery, newCat) => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (newQuery.trim()) params.set("q", newQuery.trim());
      if (newCat && newCat !== "all") params.set("category", newCat);
      const queryString = params.toString();
      router.replace(`/search${queryString ? `?${queryString}` : ""}`, { scroll: false });
    });
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    updateUrl(val, selectedCategory);
  };

  const handleCategorySelect = (catSlug) => {
    setSelectedCategory(catSlug);
    updateUrl(query, catSlug);
  };

  // Local filtering and scoring for instant response
  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const targetCat = selectedCategory.trim().toLowerCase();

    let list = allNotes;
    if (targetCat && targetCat !== "all") {
      list = list.filter((n) => n.category.toLowerCase() === targetCat);
    }

    if (!normalizedQuery) {
      return targetCat && targetCat !== "all" ? list : [];
    }

    const terms = normalizedQuery.split(/\s+/).filter(Boolean);

    return list
      .map((note) => {
        const title = (note.title || "").toLowerCase();
        const desc = (note.description || "").toLowerCase();
        const cat = `${note.category} ${note.categoryLabel}`.toLowerCase();
        const tags = (note.tags || []).join(" ").toLowerCase();
        const haystack = `${title} ${desc} ${cat} ${tags}`;

        if (!terms.every((term) => haystack.includes(term))) {
          return null;
        }

        let score = 0;
        if (title === normalizedQuery) score += 200;
        else if (title.includes(normalizedQuery)) score += 100;
        if (tags.includes(normalizedQuery)) score += 50;
        if (cat.includes(normalizedQuery)) score += 40;
        if (desc.includes(normalizedQuery)) score += 20;

        return { note, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.note);
  }, [query, selectedCategory, allNotes]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-zinc-100 tracking-tight mb-2">
          Search Engineering Library
        </h1>
        <p className="text-sm text-zinc-400">
          Search through production-grade engineering guides, architectural patterns, and deep dives.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search by topic, keyword, category, or tag (e.g. docker, raft, postgres)..."
          className="w-full pl-11 pr-10 py-3.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition text-base"
          autoFocus
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              updateUrl("", selectedCategory);
            }}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition"
            aria-label="Clear search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Category Pills & Count Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8 border-b border-zinc-800/80 pb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleCategorySelect("all")}
            className={`px-3 py-1 text-xs font-medium rounded-full transition ${
              selectedCategory === "all"
                ? "bg-violet-950/60 text-violet-300 border border-violet-700/50"
                : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleCategorySelect(cat.slug)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                selectedCategory.toLowerCase() === cat.slug.toLowerCase()
                  ? "bg-violet-950/60 text-violet-300 border border-violet-700/50"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        <div className="text-xs text-zinc-500 font-mono">
          {query.trim() || selectedCategory !== "all"
            ? `${filteredNotes.length} ${filteredNotes.length === 1 ? "result" : "results"}`
            : `${allNotes.length} notes in library`}
        </div>
      </div>

      {/* Results Section */}
      {query.trim() || selectedCategory !== "all" ? (
        filteredNotes.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredNotes.map((note) => (
              <Link
                key={note.slug}
                href={`/notes/${note.slug}`}
                className="group flex flex-col justify-between p-5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-lg transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <CategoryBadge category={note.category} label={note.categoryLabel} />
                    <span className="text-xs text-zinc-500 font-mono">{note.readingTime}</span>
                  </div>
                  <h3 className="text-base font-medium text-zinc-100 group-hover:text-violet-400 transition-colors line-clamp-2 mb-2">
                    {note.title}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                    {note.description}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-800/60 text-xs text-zinc-500">
                  <span className="capitalize">{note.difficulty}</span>
                  <span>{new Date(note.published).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
            <svg className="w-10 h-10 mx-auto text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-sm font-medium text-zinc-300 mb-1">No notes found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              We couldn't find anything matching &ldquo;{query}&rdquo;
              {selectedCategory !== "all" && ` in ${selectedCategory}`}. Try different keywords or clear filters.
            </p>
          </div>
        )
      ) : (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">
            Popular Topics & Notes
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {allNotes.slice(0, 8).map((note) => (
              <Link
                key={note.slug}
                href={`/notes/${note.slug}`}
                className="group flex flex-col justify-between p-5 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 rounded-lg transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <CategoryBadge category={note.category} label={note.categoryLabel} />
                    <span className="text-xs text-zinc-500 font-mono">{note.readingTime}</span>
                  </div>
                  <h3 className="text-base font-medium text-zinc-100 group-hover:text-violet-400 transition-colors line-clamp-2 mb-2">
                    {note.title}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                    {note.description}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-800/60">
                  <span className="capitalize">{note.difficulty}</span>
                  <span>{new Date(note.published).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
