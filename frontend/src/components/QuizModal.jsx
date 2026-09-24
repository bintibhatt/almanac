"use client";

import { useState, useEffect } from "react";

export default function QuizModal({ isOpen, onClose, note }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen && note) {
      setLoading(true);
      setSubmitted(false);
      setUserAnswers({});

      fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: note.slug,
          title: note.title,
          category: note.category,
          content: note.content,
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

  const handleOptionSelect = (qIndex, optIndex) => {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct_index) correct++;
    });
    return Math.round((correct / questions.length) * 100);
  };

  const score = submitted ? calculateScore() : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md transition-all">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[var(--border-strong)] bg-[var(--surface-solid)] p-6 shadow-2xl sm:p-8">
        {/* Top Accent Gradient Bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-600" />

        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                AI Knowledge Verification
              </span>
            </div>
            <h2 className="text-xl font-bold text-[var(--foreground)] sm:text-2xl line-clamp-1">
              {note?.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            aria-label="Close Quiz"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[var(--muted)] space-y-4">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
            <p className="text-sm font-medium">Generating adaptive technical quiz...</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {questions.map((q, qIdx) => {
              const isCorrect = userAnswers[qIdx] === q.correct_index;

              return (
                <div
                  key={q.id || qIdx}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-sky-400">
                      Question {qIdx + 1} of {questions.length}
                    </span>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-0.5 text-xs font-semibold text-[var(--muted)]">
                      {q.difficulty || "Intermediate"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-[var(--foreground)] leading-snug">
                    {q.question}
                  </h3>

                  <div className="mt-4 space-y-2.5">
                    {q.options.map((opt, optIdx) => {
                      const selected = userAnswers[qIdx] === optIdx;
                      let btnStyle =
                        "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)] hover:border-sky-500/40 hover:bg-[var(--surface-hover)]";

                      if (submitted) {
                        if (optIdx === q.correct_index) {
                          btnStyle = "border-emerald-500/60 bg-emerald-500/15 text-emerald-300 font-bold shadow-md shadow-emerald-500/10";
                        } else if (selected && !isCorrect) {
                          btnStyle = "border-rose-500/60 bg-rose-500/15 text-rose-300 font-medium";
                        }
                      } else if (selected) {
                        btnStyle = "border-sky-500 bg-sky-500/15 text-sky-300 font-bold shadow-md shadow-sky-500/10";
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleOptionSelect(qIdx, optIdx)}
                          className={`w-full text-left flex items-start gap-3 rounded-xl border p-3.5 text-sm transition-all duration-200 ${btnStyle}`}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-current bg-black/20 text-xs font-bold">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="pt-0.5 leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {submitted && (
                    <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 text-xs leading-relaxed text-[var(--muted-light)]">
                      <span className="font-bold text-sky-400">💡 Explanation: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Score & Action Footer */}
            <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
              {submitted ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-lg font-black text-emerald-400">
                    {score}%
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--foreground)]">
                      {score >= 80 ? "Mastery Achieved! 🎉" : "Good Attempt! Keep Revising."}
                    </div>
                    <div className="text-xs text-[var(--muted)]">Score logged to study history</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs font-medium text-[var(--muted)]">
                  Select an answer for each question before submitting.
                </div>
              )}

              <div className="flex gap-3">
                {!submitted ? (
                  <button
                    onClick={() => setSubmitted(true)}
                    disabled={Object.keys(userAnswers).length < questions.length}
                    className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:opacity-95 disabled:opacity-40"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setUserAnswers({});
                    }}
                    className="w-full sm:w-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
                  >
                    Retake Quiz
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

