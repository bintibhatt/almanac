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
          // Increment review count in localStorage
          try {
            const current = Number(localStorage.getItem("almanac_flashcard_reviews") || "0");
            localStorage.setItem("almanac_flashcard_reviews", String(current + 1));
          } catch {
            // Failsafe
          }
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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Spaced Repetition Flashcards
            </span>
            <h2 className="text-xs font-medium text-zinc-200 line-clamp-1">{note?.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-xs text-zinc-400 hover:text-zinc-200 transition"
            aria-label="Close Flashcards"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-zinc-500 space-y-2">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-violet-500/40 border-t-violet-400" />
            <p className="text-xs font-mono">Generating conceptual cards...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs">No flashcards generated for this note.</div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Progress */}
            <div className="w-full space-y-1.5 mb-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <span className="font-mono text-violet-400">{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-1 w-full rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Flip Card Container */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="group relative h-60 w-full cursor-pointer overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 text-center shadow-lg transition-all hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="flex h-full flex-col items-center justify-between">
                <span className="inline-flex items-center rounded-full border border-violet-800/40 bg-violet-950/40 px-2.5 py-0.5 text-[10px] font-mono text-violet-300">
                  {currentCard?.concept || "Key Concept"}
                </span>

                {!isFlipped ? (
                  <div className="my-auto px-2">
                    <p className="text-sm sm:text-base font-medium text-zinc-100 leading-snug">
                      {currentCard?.question}
                    </p>
                  </div>
                ) : (
                  <div className="my-auto px-2">
                    <p className="text-xs sm:text-sm leading-relaxed text-zinc-300">
                      {currentCard?.answer}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                  <span>Click or press <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1 py-0.5 text-[10px] text-zinc-400">Space</kbd> to flip</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-5 flex items-center justify-between w-full">
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition"
              >
                ← Prev
              </button>
              <div className="hidden text-[10px] font-mono text-zinc-500 sm:block">
                Navigate with <kbd className="rounded border border-zinc-800 px-1 py-0.5">←</kbd> <kbd className="rounded border border-zinc-800 px-1 py-0.5">→</kbd>
              </div>
              <button
                onClick={handleNext}
                className="flex items-center gap-1 rounded-md bg-violet-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition"
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
