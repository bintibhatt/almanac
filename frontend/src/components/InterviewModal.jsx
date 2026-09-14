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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Technical Interview Preparation
            </span>
            <h2 className="text-xl font-bold text-[var(--foreground)]">{note.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[var(--muted)]">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--foreground)] border-t-transparent" />
            <p className="mt-4 font-medium">Generating technical interview questions...</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                    {q.level || "Senior"} Level
                  </span>
                  <span className="text-xs text-[var(--muted)]">Question {idx + 1}</span>
                </div>

                <h3 className="mt-3 text-base font-semibold text-[var(--foreground)]">
                  {q.question}
                </h3>

                <button
                  onClick={() => toggleReveal(idx)}
                  className="mt-4 inline-flex items-center text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  {revealed[idx] ? "Hide Model Answer ▲" : "Reveal Model Answer ▼"}
                </button>

                {revealed[idx] && (
                  <div className="mt-3 space-y-3 rounded-lg bg-[var(--surface)] p-4 text-xs leading-relaxed text-[var(--foreground)]">
                    <div>
                      <span className="font-bold text-emerald-400">Model Answer: </span>
                      {q.model_answer}
                    </div>
                    {q.follow_up_prompt && (
                      <div className="border-t border-[var(--border)] pt-2 text-[var(--muted)]">
                        <span className="font-bold text-[var(--foreground)]">Follow-up: </span>
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
