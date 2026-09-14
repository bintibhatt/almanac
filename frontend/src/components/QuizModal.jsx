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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              AI Knowledge Quiz
            </span>
            <h2 className="text-xl font-bold text-[var(--foreground)] sm:text-2xl">
              {note.title}
            </h2>
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
            <p className="mt-4 font-medium">Generating technical quiz questions...</p>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {questions.map((q, qIdx) => {
              const isSelected = userAnswers[qIdx] !== undefined;
              const isCorrect = userAnswers[qIdx] === q.correct_index;

              return (
                <div
                  key={q.id || qIdx}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--muted)]">
                      Question {qIdx + 1} of {questions.length}
                    </span>
                    <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]">
                      {q.difficulty || "Intermediate"}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-[var(--foreground)]">
                    {q.question}
                  </h3>

                  <div className="mt-4 space-y-2.5">
                    {q.options.map((opt, optIdx) => {
                      const selected = userAnswers[qIdx] === optIdx;
                      let btnStyle =
                        "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--border-strong)]";

                      if (submitted) {
                        if (optIdx === q.correct_index) {
                          btnStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold";
                        } else if (selected && !isCorrect) {
                          btnStyle = "border-rose-500 bg-rose-500/10 text-rose-400";
                        }
                      } else if (selected) {
                        btnStyle = "border-[var(--foreground)] bg-[var(--surface-hover)] font-semibold";
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleOptionSelect(qIdx, optIdx)}
                          className={`w-full text-left rounded-lg border p-3.5 text-sm transition ${btnStyle}`}
                        >
                          <span className="mr-2.5 font-bold text-[var(--muted)]">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {submitted && (
                    <div className="mt-4 rounded-lg bg-[var(--surface-muted)] p-3.5 text-xs leading-relaxed text-[var(--muted)]">
                      <span className="font-bold text-[var(--foreground)]">Explanation: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-4">
              {submitted ? (
                <div className="text-lg font-bold">
                  Score: <span className="text-emerald-400">{calculateScore()}%</span>
                </div>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                {!submitted ? (
                  <button
                    onClick={() => setSubmitted(true)}
                    disabled={Object.keys(userAnswers).length < questions.length}
                    className="rounded-full bg-[var(--foreground)] px-6 py-2.5 text-sm font-semibold text-[var(--background)] transition hover:opacity-90 disabled:opacity-50"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setUserAnswers({});
                    }}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-2.5 text-sm font-semibold hover:border-[var(--border-strong)]"
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
