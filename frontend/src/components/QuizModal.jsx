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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md transition-all">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Knowledge Verification
            </span>
            <h2 className="text-lg font-bold text-white sm:text-xl line-clamp-1">
              {note?.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close Quiz"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 space-y-3">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <p className="text-xs font-medium">Generating technical quiz...</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {questions.map((q, qIdx) => {
              const isCorrect = userAnswers[qIdx] === q.correct_index;

              return (
                <div
                  key={q.id || qIdx}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">
                      Question {qIdx + 1} of {questions.length}
                    </span>
                    <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                      {q.difficulty || "Intermediate"}
                    </span>
                  </div>
                  <h3 className="mt-2.5 text-sm font-bold text-slate-100 leading-snug">
                    {q.question}
                  </h3>

                  <div className="mt-4 space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const selected = userAnswers[qIdx] === optIdx;
                      let btnStyle =
                        "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10";

                      if (submitted) {
                        if (optIdx === q.correct_index) {
                          btnStyle = "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 font-semibold";
                        } else if (selected && !isCorrect) {
                          btnStyle = "border-rose-500/50 bg-rose-500/10 text-rose-300 font-normal";
                        }
                      } else if (selected) {
                        btnStyle = "border-sky-500/50 bg-sky-500/10 text-white font-semibold";
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleOptionSelect(qIdx, optIdx)}
                          className={`w-full text-left flex items-start gap-3 rounded-lg border p-3 text-xs transition-all duration-150 ${btnStyle}`}
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/10 bg-black/20 text-[10px] font-mono">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="pt-0.5 leading-relaxed">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {submitted && (
                    <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3 text-xs leading-relaxed text-slate-400">
                      <span className="font-semibold text-slate-200">Explanation: </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Score & Action Footer */}
            <div className="flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              {submitted ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white font-mono">
                    {score}%
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {score >= 80 ? "Mastery Achieved" : "Good Attempt"}
                    </div>
                    <div className="text-[11px] text-slate-400">Score logged to study history</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  Select an answer for each question before submitting.
                </div>
              )}

              <div className="flex gap-3">
                {!submitted ? (
                  <button
                    onClick={() => setSubmitted(true)}
                    disabled={Object.keys(userAnswers).length < questions.length}
                    className="w-full sm:w-auto rounded-lg bg-white px-5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-40"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setUserAnswers({});
                    }}
                    className="w-full sm:w-auto rounded-lg border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
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



