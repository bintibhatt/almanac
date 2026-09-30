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
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <button
          onClick={() => setActiveModal("chat")}
          className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-zinc-50 px-3.5 py-1.5 text-xs font-medium transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Ask Article AI</span>
        </button>

        <button
          onClick={() => setActiveModal("flashcards")}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 px-3.5 py-1.5 text-xs font-medium transition"
        >
          <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Flashcards</span>
        </button>

        <button
          onClick={() => setActiveModal("quiz")}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 px-3.5 py-1.5 text-xs font-medium transition"
        >
          <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Quiz</span>
        </button>

        <button
          onClick={() => setActiveModal("interview")}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 px-3.5 py-1.5 text-xs font-medium transition"
        >
          <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Interview Prep</span>
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
