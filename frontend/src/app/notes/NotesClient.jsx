"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import RequestNoteModal from "@/components/RequestNoteModal";

export default function NotesClient({ notes = [], categories = [] }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "oldest" | "reading-time" | "category"
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const filteredAndSortedNotes = useMemo(() => {
    let list = [...notes];

    // Filter by category
    if (selectedCategory !== "all") {
      list = list.filter((n) => n.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((n) => {
        const title = (n.title || "").toLowerCase();
        const desc = (n.description || "").toLowerCase();
        const tags = (n.tags || []).join(" ").toLowerCase();
        return title.includes(q) || desc.includes(q) || tags.includes(q);
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.published) - new Date(a.published);
      }
      if (sortBy === "oldest") {
        return new Date(a.published) - new Date(b.published);
      }
      if (sortBy === "reading-time") {
        const parseTime = (str) => parseInt(str, 10) || 5;
        return parseTime(a.readingTime) - parseTime(b.readingTime);
      }
      if (sortBy === "category") {
        return (a.categoryLabel || "").localeCompare(b.categoryLabel || "");
      }
      return 0;
    });

    return list;
  }, [notes, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-zinc-100 tracking-tight mb-2">
          Engineering Library
        </h1>
        <p className="text-sm text-zinc-400">
          Curated, production-grade technical articles on AI, distributed systems, backend architecture, and infrastructure.
        </p>
      </div>

      {/* Controls Bar: Search & Sort & View */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        {/* Search input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter articles in view..."
            className="w-full pl-9 pr-8 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-500 hover:text-zinc-300"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort & View toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-md px-2.5 py-2 focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="reading-time">Reading time</option>
              <option value="category">Category</option>
            </select>
          </div>

          <div className="flex items-center border border-zinc-800 rounded-md p-0.5 bg-zinc-900">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded text-xs transition ${
                viewMode === "grid" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Grid view"
              aria-label="Grid view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded text-xs transition ${
                viewMode === "list" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="List view"
              aria-label="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => setRequestModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-violet-600 hover:bg-violet-500 px-3 py-1.5 text-xs font-medium text-white transition cursor-pointer shrink-0"
          >
            <span>+</span>
            <span className="hidden sm:inline">Request Note</span>
            <span className="sm:hidden">Request</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-1.5 mb-8 border-b border-zinc-800/80 pb-4">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1 text-xs font-medium rounded-full transition ${
            selectedCategory === "all"
              ? "bg-violet-950/60 text-violet-300 border border-violet-700/50"
              : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          All ({notes.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setSelectedCategory(cat.slug)}
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

      {/* Notes Display */}
      {filteredAndSortedNotes.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedNotes.map((note) => (
              <Link
                key={note.slug}
                href={`/notes/${note.slug}`}
                className="group flex flex-col justify-between p-5 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-lg transition"
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
        ) : (
          <div className="divide-y divide-zinc-800/80 border border-zinc-800/80 rounded-lg bg-zinc-900/30 overflow-hidden">
            {filteredAndSortedNotes.map((note) => (
              <Link
                key={note.slug}
                href={`/notes/${note.slug}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-zinc-900/80 transition gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CategoryBadge category={note.category} label={note.categoryLabel} />
                    <span className="text-xs text-zinc-500 font-mono">{note.readingTime}</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-medium text-zinc-100 group-hover:text-violet-400 transition-colors truncate">
                    {note.title}
                  </h3>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {note.description}
                  </p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center text-xs text-zinc-500 shrink-0 gap-1">
                  <span className="capitalize">{note.difficulty}</span>
                  <span>{new Date(note.published).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-16 px-4 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
          <svg className="w-10 h-10 mx-auto text-zinc-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-sm font-medium text-zinc-300 mb-1">No notes match your filter</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
            Try adjusting your search query or selecting a different category.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="px-3.5 py-1.5 text-xs font-medium text-violet-300 bg-violet-950/60 border border-violet-800/60 rounded-md hover:bg-violet-900/50 transition"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Manual User Note Request Modal */}
      <RequestNoteModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
      />
    </div>
  );
}

