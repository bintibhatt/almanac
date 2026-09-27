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
      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-5">
        <button
          onClick={() => setActiveModal("quiz")}
          className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/60 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-800/80 hover:border-sky-500/30"
        >
          <svg className="h-3.5 w-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Take Quiz
        </button>

        <button
          onClick={() => setActiveModal("flashcards")}
          className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/60 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-800/80 hover:border-sky-500/30"
        >
          <svg className="h-3.5 w-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Flashcards
        </button>

        <button
          onClick={() => setActiveModal("interview")}
          className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/60 px-3.5 py-1.5 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-800/80 hover:border-sky-500/30"
        >
          <svg className="h-3.5 w-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Interview Prep
        </button>

        <button
          onClick={() => setActiveModal("chat")}
          className="inline-flex items-center gap-2 rounded-md bg-sky-500 px-4 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-sky-400 shadow-sm"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

