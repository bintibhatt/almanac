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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md transition-all">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-solid)] p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                Technical Interview Prep
              </span>
            </div>
            <h2 className="text-lg font-bold text-[var(--foreground)] sm:text-xl line-clamp-1">
              {note?.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] text-xs text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            aria-label="Close Modal"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[var(--muted)] space-y-3">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--foreground)] border-t-transparent" />
            <p className="text-xs font-medium">Generating interview questions...</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-5 backdrop-blur-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-2.5 py-0.5 text-[10px] font-mono text-[var(--muted-light)]">
                    {q.level || "Senior"} Level
                  </span>
                  <span className="text-[11px] font-mono text-[var(--muted)]">Question {idx + 1} of {questions.length}</span>
                </div>

                <h3 className="mt-2.5 text-sm font-bold text-[var(--foreground)] leading-snug">
                  {q.question}
                </h3>

                <button
                  onClick={() => toggleReveal(idx)}
                  className="mt-4 flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                >
                  <span>{revealed[idx] ? "Hide Model Solution" : "Reveal Model Solution"}</span>
                  <svg
                    className={`h-3.5 w-3.5 text-[var(--muted)] transition-transform ${revealed[idx] ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {revealed[idx] && (
                  <div className="mt-3 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] p-4 text-xs leading-relaxed text-[var(--muted)]">
                    <div>
                      <span className="font-semibold text-[var(--foreground)]">Expected Architecture & Answer: </span>
                      {q.model_answer}
                    </div>
                    {q.follow_up_prompt && (
                      <div className="border-t border-[var(--border)] pt-2.5 text-[var(--muted)]">
                        <span className="font-semibold text-[var(--foreground)]">Interviewer Follow-up Question: </span>
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


