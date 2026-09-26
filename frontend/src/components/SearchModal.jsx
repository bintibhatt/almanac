"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open trigger handled by parent or state
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/ask?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          setResults(data.notes || []);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelectNote = (slug) => {
    onClose();
    router.push(`/notes/${slug}`);
  };

  const getCategoryColor = (cat) => {
    switch (cat?.toLowerCase()) {
      case "ai":
      case "ai / search":
        return "border-sky-500/30 bg-sky-500/10 text-sky-400";
      case "system-design":
      case "system design":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
      case "backend":
      case "infra":
        return "border-indigo-500/30 bg-indigo-500/10 text-indigo-400";
      case "security":
        return "border-amber-500/30 bg-amber-500/10 text-amber-400";
      default:
        return "border-slate-700 bg-slate-800/60 text-slate-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-16 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-md border border-slate-800 bg-[#0d1322] shadow-2xl">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-slate-800 px-4 py-3.5">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to search notes, architecture, concepts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent px-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none"
          />
          <kbd className="hidden rounded border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-slate-400 sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Search Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent mb-2" />
              Searching library notes...
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              <div className="px-2 pb-1 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Matching Notes ({results.length})
              </div>
              {results.map((note) => (
                <button
                  key={note.slug}
                  onClick={() => handleSelectNote(note.slug)}
                  className="w-full text-left flex items-center justify-between rounded-md border border-slate-800/80 bg-slate-900/50 p-3 transition hover:border-sky-500/40 hover:bg-slate-900/80"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded border px-2 py-0.5 text-[10px] font-mono font-medium ${getCategoryColor(note.category)}`}>
                        {note.categoryLabel || note.category}
                      </span>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{note.title}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{note.description}</p>
                  </div>
                  <span className="shrink-0 text-xs text-sky-400 font-medium ml-4">View →</span>
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No notes found for &quot;<span className="text-white font-medium">{query}</span>&quot;
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 px-2">
                Quick Category Shortcuts
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onClose();
                    router.push("/notes?category=ai");
                  }}
                  className="flex items-center gap-2.5 rounded-md border border-sky-500/20 bg-sky-500/10 p-3 text-left transition hover:border-sky-500/40"
                >
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  <div>
                    <div className="text-xs font-bold text-sky-300">AI & RAG Systems</div>
                    <div className="text-[10px] text-slate-400">Vector DB, Hybrid Search</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    router.push("/notes?category=system-design");
                  }}
                  className="flex items-center gap-2.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-left transition hover:border-emerald-500/40"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-emerald-300">System Design</div>
                    <div className="text-[10px] text-slate-400">Load Balancers, Locks</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    router.push("/notes?category=backend");
                  }}
                  className="flex items-center gap-2.5 rounded-md border border-indigo-500/20 bg-indigo-500/10 p-3 text-left transition hover:border-indigo-500/40"
                >
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  <div>
                    <div className="text-xs font-bold text-indigo-300">Backend & Infra</div>
                    <div className="text-[10px] text-slate-400">cgroups, Docker, Caching</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    router.push("/notes?category=security");
                  }}
                  className="flex items-center gap-2.5 rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-left transition hover:border-amber-500/40"
                >
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-amber-300">Web Security</div>
                    <div className="text-[10px] text-slate-400">HTTPS, TLS 1.3, Auth</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
