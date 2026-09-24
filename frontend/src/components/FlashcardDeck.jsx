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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-[var(--surface-solid)] p-6 shadow-2xl sm:p-8">
        {/* Top Accent Gradient Bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-600" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                Spaced Repetition Flashcards
              </span>
            </div>
            <h2 className="text-lg font-bold text-[var(--foreground)] line-clamp-1">{note?.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
            aria-label="Close Flashcards"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[var(--muted)] space-y-4">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
            <p className="text-sm font-medium">Generating technical flashcards with AI...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="py-16 text-center text-[var(--muted)]">No flashcards available for this note.</div>
        ) : (
          <div className="mt-6 flex flex-col items-center">
            {/* Progress Bar */}
            <div className="w-full space-y-2 mb-6">
              <div className="flex items-center justify-between text-xs font-medium text-[var(--muted)]">
                <span>Card {currentIndex + 1} of {cards.length}</span>
                <span className="text-sky-400 font-semibold">{Math.round(progressPercent)}% Completed</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[var(--surface-muted)] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Flip Card Container */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="group relative h-72 w-full cursor-pointer overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-gradient-to-br from-[var(--surface)] to-[var(--background)] p-8 text-center shadow-xl transition-all duration-300 hover:border-sky-500/40 hover:shadow-sky-500/10"
            >
              <div className="flex h-full flex-col items-center justify-between">
                <span className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-400">
                  {currentCard?.concept || "Key Concept"}
                </span>

                {!isFlipped ? (
                  <div className="space-y-4 my-auto">
                    <p className="text-lg font-bold text-[var(--foreground)] sm:text-xl leading-snug">
                      {currentCard?.question}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 my-auto">
                    <p className="text-sm leading-relaxed text-[var(--muted-light)] sm:text-base">
                      {currentCard?.answer}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] opacity-80 group-hover:opacity-100">
                  <span>🔄 Click or Press <kbd className="rounded border border-[var(--border)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px]">Space</kbd> to flip</span>
                </div>
              </div>
            </div>

            {/* Navigation Bar */}
            <div className="mt-6 flex items-center justify-between w-full">
              <button
                onClick={handlePrev}
                className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
              >
                ← Previous
              </button>
              <div className="hidden text-xs text-[var(--muted)] sm:block">
                Use <kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono">←</kbd> <kbd className="rounded border border-[var(--border)] px-1 py-0.5 font-mono">→</kbd> keys
              </div>
              <button
                onClick={handleNext}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:opacity-95"
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

