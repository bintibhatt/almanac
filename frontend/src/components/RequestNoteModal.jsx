"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STAGES = [
  "Checking knowledge base for existing notes...",
  "Researching architectural concepts & invariants...",
  "Synthesizing production patterns & code examples...",
  "Validating technical frontmatter & content integrity...",
  "Finalizing global knowledge entry...",
];

export default function RequestNoteModal({ isOpen, onClose }) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("backend");
  const [loading, setLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setTopic("");
      setResult(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval = null;
    if (loading) {
      setStageIndex(0);
      interval = setInterval(() => {
        setStageIndex((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
      }, 1400);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  const handleGenerate = async (force = false) => {
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/notes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          category,
          force,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Failed to generate note.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400">
                Global Knowledge Library
              </span>
            </div>
            <h2 className="text-lg font-semibold text-zinc-100">
              Request a Knowledge Note
            </h2>
            <p className="text-xs text-zinc-400">
              Ask for an architectural guide on any engineering topic. Generated notes become part of the public Almanac library.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 text-sm p-1 rounded-md cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-10 h-10 mx-auto rounded-full border-2 border-violet-500/20 border-t-violet-400 animate-spin" />
            <div className="space-y-1">
              <p className="text-xs font-mono text-violet-400">
                {STAGES[stageIndex]}
              </p>
              <p className="text-[11px] text-zinc-500">
                Validating frontmatter, checking duplicate index, formulating content...
              </p>
            </div>
          </div>
        ) : result ? (
          <div className="space-y-4 pt-1">
            {result.already_exists ? (
              <div className="rounded-lg border border-amber-900/60 bg-amber-950/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-medium">
                  <span>ℹ️ A matching note already exists in the library</span>
                </div>
                <div className="p-3 rounded-md bg-zinc-950/60 border border-zinc-800/80">
                  <h4 className="text-sm font-semibold text-zinc-100">
                    {result.note?.title}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    {result.note?.reason}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleGenerate(true)}
                    className="text-xs text-zinc-400 hover:text-zinc-200 underline font-mono cursor-pointer"
                  >
                    Force Regenerate Note
                  </button>
                  <Link
                    href={`/notes/${result.note?.slug}`}
                    onClick={onClose}
                    className="rounded bg-violet-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition"
                  >
                    Read Existing Note →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                  <span>✓ Note generated and added to global knowledge library!</span>
                </div>
                <div className="p-3 rounded-md bg-zinc-950/60 border border-zinc-800/80">
                  <h4 className="text-sm font-semibold text-zinc-100">
                    {result.title}
                  </h4>
                  <span className="text-[11px] font-mono text-zinc-500 block mt-1">
                    Category: {result.category} • {result.reading_time || "5 min read"}
                  </span>
                </div>
                <div className="flex justify-end pt-1">
                  <Link
                    href={`/notes/${result.slug}`}
                    onClick={onClose}
                    className="rounded bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition"
                  >
                    Open New Note →
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate(false);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Topic or Technical Question <span className="text-violet-400">*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. How does PostgreSQL MVCC work?"
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Primary Category Domain
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none cursor-pointer"
              >
                <option value="backend">Backend</option>
                <option value="system-design">System Design</option>
                <option value="ai">AI / Search</option>
                <option value="devops">DevOps &amp; Infra</option>
                <option value="security">Security</option>
                <option value="databases">Databases</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-zinc-800 px-3.5 py-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!topic.trim()}
                className="rounded-md bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition disabled:opacity-50 cursor-pointer"
              >
                Generate Note →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
