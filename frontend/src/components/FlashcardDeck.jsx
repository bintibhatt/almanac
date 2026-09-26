"use client";

import { useState, useEffect, useCallback } from "react";

export default function FlashcardDeck({ isOpen, onClose, note }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (isOpen && note) {
      setLoading(true);
      setCurrentIndex(0);
      setIsFlipped(false);

      fetch("/api/flashcards", {
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
          setCards(data.cards || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen, note]);

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  }, [cards.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  }, [cards.length]);

  useEffect(() => {
    if (!isOpen || cards.length === 0) return;

    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === "ArrowRight") {
        handleNext();
      } else if (e.code === "ArrowLeft") {
        handlePrev();
      } else if (e.code === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, cards.length, handleNext, handlePrev, onClose]);

  if (!isOpen) return null;

  const currentCard = cards[currentIndex];
  const progressPercent = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl sm:p-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Spaced Repetition
            </span>
            <h2 className="text-base font-bold text-white line-clamp-1">{note?.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close Flashcards"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 space-y-3">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <p className="text-xs font-medium">Generating technical flashcards...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">No flashcards available for this note.</div>
        ) : (
          <div className="mt-6 flex flex-col items-center">
            {/* Progress Bar */}
            <div className="w-full space-y-2 mb-6">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <span className="font-mono text-slate-200">{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Flip Card Container */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="group relative h-64 w-full cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center shadow-lg transition-all duration-200 hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="flex h-full flex-col items-center justify-between">
                <span className="inline-flex items-center rounded border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-mono text-slate-300">
                  {currentCard?.concept || "Key Concept"}
                </span>

                {!isFlipped ? (
                  <div className="space-y-4 my-auto">
                    <p className="text-base font-bold text-white sm:text-lg leading-snug">
                      {currentCard?.question}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 my-auto">
                    <p className="text-xs leading-relaxed text-slate-300 sm:text-sm">
                      {currentCard?.answer}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <span>Click or press <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300">Space</kbd> to flip</span>
                </div>
              </div>
            </div>

            {/* Navigation Bar */}
            <div className="mt-6 flex items-center justify-between w-full">
              <button
                onClick={handlePrev}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
              >
                ← Previous
              </button>
              <div className="hidden text-[11px] font-mono text-slate-400 sm:block">
                Use <kbd className="rounded border border-white/10 px-1.5 py-0.5">←</kbd> <kbd className="rounded border border-white/10 px-1.5 py-0.5">→</kbd>
              </div>
              <button
                onClick={handleNext}
                className="flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


