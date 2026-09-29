"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";

export default function DashboardClient({ libraryStats, systemState, recentNotes }) {
  const [localStats, setLocalStats] = useState({
    completedQuizzes: 0,
    cardsReviewed: 0,
    completedInterviews: 0,
    readArticles: 0,
  });

  useEffect(() => {
    try {
      const readSet = JSON.parse(localStorage.getItem("almanac_read_articles") || "[]");
      const quizHistory = JSON.parse(localStorage.getItem("almanac_quiz_history") || "[]");
      const cardHistory = JSON.parse(localStorage.getItem("almanac_flashcard_reviews") || "0");
      const interviewHistory = JSON.parse(localStorage.getItem("almanac_interview_history") || "[]");

      setLocalStats({
        completedQuizzes: quizHistory.length,
        cardsReviewed: Number(cardHistory) || 0,
        completedInterviews: interviewHistory.length,
        readArticles: readSet.length,
      });
    } catch {
      // LocalStorage access failsafe
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-zinc-100 tracking-tight mb-2">
          Knowledge Dashboard
        </h1>
        <p className="text-sm text-zinc-400">
          Real-time metrics, autonomous ingestion state, and your active learning milestones.
        </p>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-1">
            Articles in Library
          </span>
          <div className="text-2xl font-semibold text-zinc-100 font-mono">
            {libraryStats.totalNotes}
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Across {libraryStats.totalCategories} domains
          </span>
        </div>

        <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-1">
            Autonomous Pipeline
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-base font-medium text-zinc-200">
              {systemState.status === "ready" ? "Operational" : "Active"}
            </span>
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block truncate">
            {systemState.lastRun ? `Last run: ${new Date(systemState.lastRun).toLocaleDateString()}` : "Automated daily"}
          </span>
        </div>

        <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-1">
            Avg Reading Time
          </span>
          <div className="text-2xl font-semibold text-zinc-100 font-mono">
            {libraryStats.avgReadingTime} min
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Technical deep dives
          </span>
        </div>

        <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-lg">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-1">
            Learning Milestones
          </span>
          <div className="text-2xl font-semibold text-violet-400 font-mono">
            {localStats.completedQuizzes + localStats.completedInterviews}
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Quizzes & mock interviews
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-8">
        {/* Category Breakdown */}
        <div className="md:col-span-1 p-6 bg-zinc-900/40 border border-zinc-800 rounded-lg flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">
              Category Distribution
            </h2>
            <div className="space-y-3">
              {libraryStats.categoryDistribution.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300">{cat.label}</span>
                    <span className="text-zinc-500 font-mono">{cat.count}</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-violet-500 h-1.5 rounded-full"
                      style={{
                        width: `${Math.round((cat.count / libraryStats.totalNotes) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-zinc-800/80">
            <Link
              href="/notes"
              className="text-xs font-medium text-violet-400 hover:text-violet-300 flex items-center gap-1"
            >
              Browse all categories →
            </Link>
          </div>
        </div>

        {/* Pipeline & Ingestion State */}
        <div className="md:col-span-2 p-6 bg-zinc-900/40 border border-zinc-800 rounded-lg flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">
              Ingestion & Vector System Telemetry
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-950/60 border border-zinc-800/60 rounded-md">
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">
                  Ingestion Run Count
                </span>
                <span className="text-lg font-mono text-zinc-200">
                  {systemState.runCount || 1} iterations
                </span>
              </div>
              <div className="p-4 bg-zinc-950/60 border border-zinc-800/60 rounded-md">
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">
                  Vector Embeddings
                </span>
                <span className="text-lg font-mono text-zinc-200">
                  {systemState.vectorCount || libraryStats.totalNotes} vectors indexed
                </span>
              </div>
              <div className="p-4 bg-zinc-950/60 border border-zinc-800/60 rounded-md">
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">
                  AI Providers Configured
                </span>
                <span className="text-lg font-mono text-zinc-200">
                  OpenRouter / Gemini / OpenAI
                </span>
              </div>
              <div className="p-4 bg-zinc-950/60 border border-zinc-800/60 rounded-md">
                <span className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">
                  Embedding Model
                </span>
                <span className="text-lg font-mono text-zinc-200">
                  BAAI/bge-small-en-v1.5
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 mt-4 leading-relaxed">
              Articles are autonomously ranked from Hacker News and GitHub Trending, verified for originality, embedded into dense vector space, and cross-referenced with cosine similarity.
            </p>
          </div>

          <div className="pt-6 mt-6 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
            <span>Workflow: `.github/workflows/ingest.yml`</span>
            <Link href="/updates" className="text-violet-400 hover:text-violet-300">
              View platform roadmap →
            </Link>
          </div>
        </div>
      </div>

      {/* Recently Published Notes */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">
          Latest Additions to the Library
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recentNotes.map((note) => (
            <Link
              key={note.slug}
              href={`/notes/${note.slug}`}
              className="p-4 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-lg transition group"
            >
              <div className="flex items-center justify-between mb-2">
                <CategoryBadge category={note.category} label={note.categoryLabel} />
                <span className="text-[11px] text-zinc-500 font-mono">{note.readingTime}</span>
              </div>
              <h3 className="text-sm font-medium text-zinc-100 group-hover:text-violet-400 transition truncate mb-1">
                {note.title}
              </h3>
              <p className="text-xs text-zinc-500 truncate">{note.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
