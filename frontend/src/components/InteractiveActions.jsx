"use client";

import { useState } from "react";
import QuizModal from "./QuizModal";
import FlashcardDeck from "./FlashcardDeck";
import InterviewModal from "./InterviewModal";
import ArticleChatDrawer from "./ArticleChatDrawer";

export default function InteractiveActions({ note }) {
  const [activeModal, setActiveModal] = useState(null);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-[var(--border)] pt-5">
        <button
          onClick={() => setActiveModal("quiz")}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
        >
          🧠 Take AI Quiz
        </button>

        <button
          onClick={() => setActiveModal("flashcards")}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
        >
          🎴 Flashcards
        </button>

        <button
          onClick={() => setActiveModal("interview")}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
        >
          🎯 Interview Prep
        </button>

        <button
          onClick={() => setActiveModal("chat")}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-4 py-2 text-xs font-semibold text-[var(--background)] transition hover:opacity-90"
        >
          💬 Ask AI
        </button>
      </div>

      <QuizModal
        isOpen={activeModal === "quiz"}
        onClose={() => setActiveModal(null)}
        note={note}
      />

      <FlashcardDeck
        isOpen={activeModal === "flashcards"}
        onClose={() => setActiveModal(null)}
        note={note}
      />

      <InterviewModal
        isOpen={activeModal === "interview"}
        onClose={() => setActiveModal(null)}
        note={note}
      />

      <ArticleChatDrawer
        isOpen={activeModal === "chat"}
        onClose={() => setActiveModal(null)}
        note={note}
      />
    </>
  );
}
