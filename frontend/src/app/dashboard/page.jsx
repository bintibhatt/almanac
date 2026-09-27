"use client";

import Link from "next/link";
import { useProgress } from "@/hooks/useProgress";

const CATEGORIES = [
  { slug: "ai", label: "AI & RAG Systems", total: 3 },
  { slug: "system-design", label: "Distributed Systems", total: 2 },
  { slug: "backend", label: "Backend Performance", total: 4 },
  { slug: "security", label: "Web Security & TLS", total: 1 },
];

export default function DashboardPage() {
  const { progress } = useProgress();

  const totalQuizzesPassed = Object.values(progress.quizScores).filter((s) => s >= 70).length;
  const avgQuizScore =
    Object.keys(progress.quizScores).length > 0
      ? Math.round(
          Object.values(progress.quizScores).reduce((a, b) => a + b, 0) /
            Object.keys(progress.quizScores).length
        )
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 space-y-12">
      {/* Unboxed Header Banner */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-8">
        <div className="space-y-2 max-w-2xl">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
            Personal Analytics & Progress
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
            Engineering Analytics <br />
            <span className="gradient-text font-normal">& Mastery Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Track course completion, quiz scores, interview prep drills, and active learning streaks across Almanac.
          </p>
        </div>

        <div className="rounded-md border border-sky-500/30 bg-sky-500/10 p-4 text-center shrink-0 min-w-[160px]">
          <div className="text-3xl font-extrabold text-sky-400 font-mono">{progress.streakDays || 1} Days</div>
          <div className="mt-1 text-[11px] font-mono text-sky-300 uppercase tracking-wider">Active Streak</div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-slate-800 bg-slate-900/50 p-5 space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Notes Completed</div>
          <div className="text-3xl font-bold text-white">
            {progress.completedNotes.length} <span className="text-xs font-normal text-slate-400">/ 14</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-sky-400 transition-all duration-300"
              style={{ width: `${Math.min(100, (progress.completedNotes.length / 14) * 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-md border border-slate-800 bg-slate-900/50 p-5 space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Quizzes Passed</div>
          <div className="text-3xl font-bold text-white">
            {totalQuizzesPassed}
          </div>
          <div className="text-xs text-slate-400">
            Avg Score: <span className="text-sky-400 font-semibold">{avgQuizScore}%</span>
          </div>
        </div>

        <div className="rounded-md border border-slate-800 bg-slate-900/50 p-5 space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Interview Drills</div>
          <div className="text-3xl font-bold text-white">
            {progress.interviewDrillsCount || 0}
          </div>
          <div className="text-xs text-slate-400">System Design Sessions</div>
        </div>

        <div className="rounded-md border border-slate-800 bg-slate-900/50 p-5 space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Overall Mastery</div>
          <div className="text-3xl font-bold text-white">
            {Math.min(100, Math.round((progress.completedNotes.length * 10) + (totalQuizzesPassed * 15)))} <span className="text-xs font-normal text-slate-400">pts</span>
          </div>
          <div className="text-xs text-slate-400">Level: <span className="text-sky-400 font-semibold">Architect</span></div>
        </div>
      </div>

      {/* Main Grid: Category Mastery & Recommendations */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Category Progress */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Knowledge Domain Breakdown</h2>
            <p className="mt-1 text-xs text-slate-400">
              Your progress tracked across core engineering domains.
            </p>
          </div>

          <div className="space-y-4">
            {CATEGORIES.map((cat) => {
              const quizScore = progress.quizScores[cat.slug] || 0;
              return (
                <div key={cat.slug} className="space-y-2.5 rounded-md border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-semibold text-slate-200">
                      {cat.label}
                    </div>
                    <span className="font-mono text-sky-400">
                      {quizScore > 0 ? `${quizScore}% Score` : "Not Started"}
                    </span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-400 transition-all duration-300"
                      style={{ width: `${quizScore > 0 ? quizScore : 10}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>{cat.total} Library Modules</span>
                    <Link href={`/notes?category=${cat.slug}`} className="hover:underline text-sky-400 font-medium">
                      Practice Topic →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Quick Launch */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-base text-white">Quick Launch</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Jump straight into learning pathways, interview drills, or notes.
            </p>

            <div className="space-y-2.5 pt-2">
              <Link
                href="/courses"
                className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/50 p-3.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-900/80 hover:border-sky-500/30"
              >
                <span>Browse Courses</span>
                <span className="text-sky-400">→</span>
              </Link>

              <Link
                href="/interview"
                className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/50 p-3.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-900/80 hover:border-sky-500/30"
              >
                <span>Practice System Design</span>
                <span className="text-sky-400">→</span>
              </Link>

              <Link
                href="/notes"
                className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/50 p-3.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-900/80 hover:border-sky-500/30"
              >
                <span>Explore All Notes</span>
                <span className="text-sky-400">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


