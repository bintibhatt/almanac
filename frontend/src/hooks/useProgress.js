"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "almanac_user_progress_v1";

const DEFAULT_PROGRESS = {
  completedNotes: [],
  quizScores: {}, // { slug: maxScore }
  flashcardsMastered: {}, // { slug: [cardIds] }
  interviewDrillsCount: 0,
  lastActiveDate: null,
  streakDays: 1,
};

export function useProgress() {
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Calculate streak
        const today = new Date().toISOString().split("T")[0];
        let streak = parsed.streakDays || 1;
        
        if (parsed.lastActiveDate) {
          const lastDate = new Date(parsed.lastActiveDate);
          const diffDays = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            streak += 1;
          } else if (diffDays > 1) {
            streak = 1;
          }
        }
        
        const updated = { ...parsed, streakDays: streak, lastActiveDate: today };
        setProgress(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } else {
        const today = new Date().toISOString().split("T")[0];
        const initial = { ...DEFAULT_PROGRESS, lastActiveDate: today };
        setProgress(initial);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      }
    } catch {
      // localStorage disabled or unavailable fallback
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveProgress = (newProgress) => {
    setProgress(newProgress);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
    } catch {
      // fallback
    }
  };

  const markNoteCompleted = (slug) => {
    if (!progress.completedNotes.includes(slug)) {
      const updated = {
        ...progress,
        completedNotes: [...progress.completedNotes, slug],
      };
      saveProgress(updated);
    }
  };

  const recordQuizScore = (slug, scorePercent) => {
    const currentMax = progress.quizScores[slug] || 0;
    if (scorePercent > currentMax) {
      const updated = {
        ...progress,
        quizScores: {
          ...progress.quizScores,
          [slug]: scorePercent,
        },
      };
      saveProgress(updated);
    }
  };

  const recordInterviewDrill = () => {
    const updated = {
      ...progress,
      interviewDrillsCount: (progress.interviewDrillsCount || 0) + 1,
    };
    saveProgress(updated);
  };

  return {
    progress,
    isLoaded,
    markNoteCompleted,
    recordQuizScore,
    recordInterviewDrill,
  };
}
