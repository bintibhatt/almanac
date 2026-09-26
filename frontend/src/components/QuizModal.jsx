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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md transition-all">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-solid)] p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
                Knowledge Verification
              </span>
            </div>
            <h2 className="text-lg font-bold text-[var(--foreground)] sm:text-xl line-clamp-1">
              {note?.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] text-xs text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            aria-label="Close Quiz"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[var(--muted)] space-y-3">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--foreground)] border-t-transparent" />
            <p className="text-xs font-medium">Generating adaptive technical quiz...</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {questions.map((q, qIdx) => {
              const isCorrect = userAnswers[qIdx] === q.correct_index;

              return (
                <div
                  key={q.id || qIdx}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-5 backdrop-blur-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[var(--muted)]">
                      Question {qIdx + 1} of {questions.length}
                    </span>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-2.5 py-0.5 text-[10px] font-mono text-[var(--muted)]">
                      {q.difficulty || "Intermediate"}
                    </span>
                  </div>
                  <h3 className="mt-2.5 text-sm font-bold text-[var(--foreground)] leading-snug">
                    {q.question}
                  </h3>

                  <div className="mt-4 space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const selected = userAnswers[qIdx] === optIdx;
                      let btnStyle =
                        "border-[var(--border)] bg-[var(--surface-solid)] text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]";

                      if (submitted) {
                        if (optIdx === q.correct_index) {
                          btnStyle = "border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-semibold";
                        } else if (selected && !isCorrect) {
                          btnStyle = "border-rose-500/60 bg-rose-500/10 text-rose-300 font-normal";
                        }
                      } else if (selected) {
                        btnStyle = "border-[var(--border-strong)] bg-[var(--surface-hover)] text-[var(--foreground)] font-semibold";
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleOptionSelect(qIdx, optIdx)}
                          className={`w-full text-left flex items-start gap-3 rounded-xl border p-3 text-xs transition-all duration-200 ${btnStyle}`}
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[var(--border)] bg-black/10 text-[10px] font-mono">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="pt-0.5 leading-relaxed">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {submitted && (
                    <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] p-3 text-xs leading-relaxed text-[var(--muted)]">
                      <span className="font-semibold text-[var(--foreground)]">Explanation: </span>
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] text-sm font-bold text-[var(--foreground)] font-mono">
                    {score}%
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--foreground)]">
                      {score >= 80 ? "Mastery Achieved" : "Good Attempt"}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">Score logged to study history</div>
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
                    className="w-full sm:w-auto rounded-xl bg-[var(--foreground)] px-5 py-2.5 text-xs font-semibold text-[var(--background)] shadow-sm transition hover:opacity-90 disabled:opacity-40"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setUserAnswers({});
                    }}
                    className="w-full sm:w-auto rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-5 py-2.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
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


