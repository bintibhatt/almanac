"use client";

import { useState, useEffect } from "react";

export default function QuizModal({ isOpen, onClose, note }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

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
    return questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const scoreVal = calculateScore();
    try {
      const history = JSON.parse(localStorage.getItem("almanac_quiz_history") || "[]");
      history.push({ slug: note.slug, score: scoreVal, date: new Date().toISOString() });
      localStorage.setItem("almanac_quiz_history", JSON.stringify(history));
    } catch {
      // LocalStorage failsafe
    }
  };

  const score = submitted ? calculateScore() : 0;

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
              Knowledge Verification Quiz
            </span>
            <h2 className="text-xs font-medium text-zinc-200 line-clamp-1">
              {note?.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-xs text-zinc-400 hover:text-zinc-200 transition"
            aria-label="Close Quiz"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-zinc-500 space-y-2">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-violet-500/40 border-t-violet-400" />
            <p className="text-xs font-mono">Generating technical quiz...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {questions.map((q, qIdx) => {
              const isCorrect = userAnswers[qIdx] === q.correct_index;

              return (
                <div
                  key={q.id || qIdx}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-zinc-500">
                      Question {qIdx + 1} of {questions.length}
                    </span>
                    <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                      {q.difficulty || "Intermediate"}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-zinc-200 leading-snug mb-3">
                    {q.question}
                  </h3>

                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const selected = userAnswers[qIdx] === optIdx;
                      let btnStyle = "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900";

                      if (submitted) {
                        if (optIdx === q.correct_index) {
                          btnStyle = "border-emerald-700/60 bg-emerald-950/60 text-emerald-300 font-medium";
                        } else if (selected && !isCorrect) {
                          btnStyle = "border-rose-700/60 bg-rose-950/60 text-rose-300";
                        }
                      } else if (selected) {
                        btnStyle = "border-violet-600 bg-violet-950/60 text-violet-200 font-medium";
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleOptionSelect(qIdx, optIdx)}
                          className={`w-full text-left flex items-start gap-2.5 rounded-md border p-2.5 text-xs transition ${btnStyle}`}
                        >
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-zinc-800 bg-zinc-950 text-[10px] font-mono text-zinc-400">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="leading-relaxed">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {submitted && (
                    <div className="mt-3 rounded border border-zinc-800 bg-zinc-950 p-2.5 text-[11px] leading-relaxed text-zinc-400">
                      <span className="font-medium text-zinc-300">Explanation: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Score & Action Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-zinc-800 pt-4">
              {submitted ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-800/60 bg-violet-950/60 text-sm font-semibold text-violet-300 font-mono">
                    {score}%
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-200">
                      {score >= 80 ? "Mastery Achieved" : "Practice Completed"}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono">Result saved to dashboard</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-500">
                  Answer each question before submitting.
                </div>
              )}

              <div className="flex gap-2">
                {!submitted ? (
                  <button
                    onClick={handleSubmit}
                    disabled={Object.keys(userAnswers).length < questions.length}
                    className="w-full sm:w-auto rounded-md bg-violet-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-40 transition"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setUserAnswers({});
                    }}
                    className="w-full sm:w-auto rounded-md border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition"
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
