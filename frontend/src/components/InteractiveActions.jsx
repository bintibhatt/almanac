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
      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-5">
        <button
          onClick={() => setActiveModal("quiz")}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20 shadow-sm"
        >
          <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Take Quiz
        </button>

        <button
          onClick={() => setActiveModal("flashcards")}
          className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs font-semibold text-sky-400 transition-all hover:border-sky-500/50 hover:bg-sky-500/20 shadow-sm"
        >
          <svg className="h-4 w-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Flashcards
        </button>

        <button
          onClick={() => setActiveModal("interview")}
          className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-400 transition-all hover:border-purple-500/50 hover:bg-purple-500/20 shadow-sm"
        >
          <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Interview Prep
        </button>

        <button
          onClick={() => setActiveModal("chat")}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:scale-[1.03]"
        >
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Ask AI
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

