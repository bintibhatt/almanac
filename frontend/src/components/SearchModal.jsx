"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import CategoryBadge from "./CategoryBadge";

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);
  const modalRef = useRef(null);
  const router = useRouter();

  // Reset when opening/closing
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (results.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        } else if (e.key === "Enter") {
          e.preventDefault();
          const selected = results[selectedIndex];
          if (selected) {
            onClose();
            router.push(`/notes/${selected.slug}`);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, router]);

  // Debounced search query calling dedicated /api/search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      setSelectedIndex(0);
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setSelectedIndex(0);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Search fetch error:", err);
        }
      } finally {
        setLoading(false);
      }
    }, 160);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Click outside to close
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const handleSelect = (slug) => {
    onClose();
    router.push(`/notes/${slug}`);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-sm p-4 pt-16 sm:pt-24 transition-opacity duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Command Search Header */}
        <div className="relative flex items-center border-b border-zinc-800 px-4 py-3">
          <svg className="w-4 h-4 text-zinc-400 shrink-0 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search library..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-zinc-500 hover:text-zinc-300 text-xs px-1.5 py-0.5"
            >
              Clear
            </button>
          )}
          <span className="hidden sm:inline-block ml-2 text-[10px] font-mono text-zinc-400 border border-zinc-700 rounded px-1.5 py-0.5">
            ESC
          </span>
        </div>

        {/* Results / Suggestions Container */}
        <div className="overflow-y-auto p-2">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-500 text-xs gap-2">
              <div className="w-5 h-5 border-2 border-violet-500/40 border-t-violet-400 rounded-full animate-spin" />
              <span>Searching library...</span>
            </div>
          ) : query.trim() ? (
            results.length > 0 ? (
              <div className="space-y-1">
                <div className="px-2 py-1 text-[11px] font-mono text-zinc-500 uppercase tracking-wider flex justify-between">
                  <span>Results</span>
                  <span>{results.length} found</span>
                </div>
                {results.map((note, idx) => (
                  <button
                    key={note.slug}
                    onClick={() => handleSelect(note.slug)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between gap-3 transition ${
                      selectedIndex === idx
                        ? "bg-violet-950/40 border border-violet-800/50 text-zinc-100"
                        : "bg-transparent border border-transparent text-zinc-300 hover:bg-zinc-800/50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CategoryBadge category={note.category} label={note.categoryLabel} />
                        <span className="text-[11px] text-zinc-500 font-mono">{note.readingTime}</span>
                      </div>
                      <h4 className="text-sm font-medium text-zinc-100 truncate">{note.title}</h4>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{note.description}</p>
                    </div>
                    <span className="text-xs text-zinc-500 font-mono shrink-0">↵</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-zinc-500">
                No matching articles for &ldquo;<span className="text-zinc-300">{query}</span>&rdquo;
              </div>
            )
          ) : (
            <div className="p-3 space-y-3">
              <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                Quick Actions
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onClose();
                    router.push("/notes");
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-zinc-700 text-left transition"
                >
                  <span className="w-2 h-2 rounded-full bg-violet-400" />
                  <div>
                    <div className="text-xs font-medium text-zinc-200">Browse Library</div>
                    <div className="text-[10px] text-zinc-500">All engineering notes</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    router.push("/dashboard");
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-zinc-700 text-left transition"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <div>
                    <div className="text-xs font-medium text-zinc-200">View Telemetry</div>
                    <div className="text-[10px] text-zinc-500">System & learning stats</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    router.push("/interview");
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-zinc-700 text-left transition"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <div>
                    <div className="text-xs font-medium text-zinc-200">System Design Drills</div>
                    <div className="text-[10px] text-zinc-500">Mock interview questions</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    router.push("/courses");
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-zinc-700 text-left transition"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <div>
                    <div className="text-xs font-medium text-zinc-200">Learning Tracks</div>
                    <div className="text-[10px] text-zinc-500">Domain roadmaps</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800/80 bg-zinc-950 text-[11px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 border border-zinc-800 rounded bg-zinc-900 font-mono text-[10px] mr-1">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 border border-zinc-800 rounded bg-zinc-900 font-mono text-[10px] mr-1">
                ↓
              </kbd>
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 border border-zinc-800 rounded bg-zinc-900 font-mono text-[10px] mr-1">
                ↵
              </kbd>
              Open
            </span>
          </div>
          <span>
            <kbd className="px-1.5 py-0.5 border border-zinc-800 rounded bg-zinc-900 font-mono text-[10px] mr-1">
              ESC
            </kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
