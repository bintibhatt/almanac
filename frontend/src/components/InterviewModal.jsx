"use client";

import { useState, useEffect } from "react";

export default function InterviewModal({ isOpen, onClose, note }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState({});

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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
    setRevealed((prev) => {
      const updated = { ...prev, [idx]: !prev[idx] };
      try {
        const history = JSON.parse(localStorage.getItem("almanac_interview_history") || "[]");
        if (!history.includes(note.slug)) {
          history.push(note.slug);
          localStorage.setItem("almanac_interview_history", JSON.stringify(history));
        }
      } catch {
        // Failsafe
      }
      return updated;
    });
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Technical Interview Practice
            </span>
            <h2 className="text-xs font-medium text-zinc-200 line-clamp-1">
              {note?.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-xs text-zinc-400 hover:text-zinc-200 transition"
            aria-label="Close Modal"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-zinc-500 space-y-2">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-violet-500/40 border-t-violet-400" />
            <p className="text-xs font-mono">Generating architectural drills...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded bg-violet-950/40 border border-violet-800/40 px-2 py-0.5 text-[10px] font-mono text-violet-300">
                    {q.level || "Senior"} Level
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Question {idx + 1} of {questions.length}
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-medium text-zinc-100 leading-snug">
                  {q.question}
                </h3>

                <button
                  onClick={() => toggleReveal(idx)}
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:border-zinc-700 transition"
                >
                  <span>{revealed[idx] ? "Hide Solution" : "Reveal Model Solution"}</span>
                  <svg
                    className={`h-3 w-3 text-zinc-400 transition-transform ${revealed[idx] ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {revealed[idx] && (
                  <div className="mt-3 space-y-2.5 rounded border border-zinc-800/80 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-300">
                    <div>
                      <span className="font-medium text-violet-300">Model Architecture &amp; Rationale: </span>
                      {q.model_answer}
                    </div>
                    {q.follow_up_prompt && (
                      <div className="border-t border-zinc-800/60 pt-2 text-zinc-400">
                        <span className="font-medium text-zinc-300">Follow-up Probe: </span>
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
