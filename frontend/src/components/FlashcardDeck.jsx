"use client";

import { useState, useEffect } from "react";

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

  if (!isOpen) return null;

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
              Spaced Repetition Flashcards
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
          <div className="py-16 text-center text-[var(--muted)]">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--foreground)] border-t-transparent" />
            <p className="mt-4 font-medium">Generating concept flashcards...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="py-12 text-center text-[var(--muted)]">No flashcards available.</div>
        ) : (
          <div className="mt-6 flex flex-col items-center">
            <div className="w-full text-right text-xs font-medium text-[var(--muted)] mb-2">
              Card {currentIndex + 1} of {cards.length}
            </div>

            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="group relative h-64 w-full cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 text-center shadow-lg transition-transform duration-300 hover:scale-[1.01]"
            >
              <div className="flex h-full flex-col items-center justify-center">
                <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--accent)] mb-3">
                  {currentCard.concept}
                </span>

                {!isFlipped ? (
                  <div>
                    <p className="text-lg font-semibold text-[var(--foreground)]">
                      {currentCard.question}
                    </p>
                    <p className="mt-4 text-xs font-medium text-[var(--muted)]">
                      Click to flip card 🔄
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm leading-relaxed text-[var(--foreground)]">
                      {currentCard.answer}
                    </p>
                    <p className="mt-4 text-xs font-medium text-[var(--muted)]">
                      Click to flip back 🔄
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between w-full">
              <button
                onClick={handlePrev}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2 text-sm font-medium hover:border-[var(--border-strong)]"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                className="rounded-full bg-[var(--foreground)] px-6 py-2 text-sm font-medium text-[var(--background)] hover:opacity-90"
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
