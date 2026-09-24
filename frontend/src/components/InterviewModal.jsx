"use client";

import { useState, useEffect } from "react";

export default function InterviewModal({ isOpen, onClose, note }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState({});

  useEffect(() => {
    if (isOpen && note) {
      setLoading(true);
      setRevealed({});

      fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: note.slug,
          title: note.title,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setQuestions(data.questions || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, note]);

  if (!isOpen) return null;

  const toggleReveal = (idx) => {
    setRevealed((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md transition-all">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[var(--border-strong)] bg-[var(--surface-solid)] p-6 shadow-2xl sm:p-8">
        {/* Top Accent Gradient Bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-400" />

        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                Technical Interview Preparation
              </span>
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)] sm:text-2xl line-clamp-1">
              {note?.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            aria-label="Close Modal"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[var(--muted)] space-y-4">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
            <p className="text-sm font-medium">Generating Senior-Level interview questions...</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-0.5 text-xs font-bold text-violet-400">
                    {q.level || "Senior"} Engineer Level
                  </span>
                  <span className="text-xs font-medium text-sky-400">Question {idx + 1} of {questions.length}</span>
                </div>

                <h3 className="mt-3 text-base font-bold text-[var(--foreground)] leading-snug">
                  {q.question}
                </h3>

                <button
                  onClick={() => toggleReveal(idx)}
                  className="mt-4 flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-violet-500/40 hover:bg-[var(--surface-hover)]"
                >
                  <span>{revealed[idx] ? "Hide Model Solution" : "Reveal Model Solution"}</span>
                  <svg
                    className={`h-3.5 w-3.5 text-violet-400 transition-transform ${revealed[idx] ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {revealed[idx] && (
                  <div className="mt-4 space-y-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 text-xs leading-relaxed text-[var(--muted-light)]">
                    <div>
                      <span className="font-bold text-emerald-400">✅ Expected Architecture & Answer: </span>
                      {q.model_answer}
                    </div>
                    {q.follow_up_prompt && (
                      <div className="border-t border-[var(--border)] pt-3 text-[var(--muted)]">
                        <span className="font-bold text-sky-400">💬 Follow-up Interviewer Question: </span>
                        {q.follow_up_prompt}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

