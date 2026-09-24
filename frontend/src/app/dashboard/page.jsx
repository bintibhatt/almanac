"use client";

import Link from "next/link";
import { useProgress } from "@/hooks/useProgress";

const CATEGORIES = [
  { slug: "ai", label: "AI & RAG Systems", icon: "🤖", total: 3 },
  { slug: "system-design", label: "Distributed Systems", icon: "🌐", total: 2 },
  { slug: "backend", label: "Backend Performance", icon: "⚡", total: 4 },
  { slug: "security", label: "Web Security & TLS", icon: "🔒", total: 1 },
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
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-12 backdrop-blur-2xl">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-bold text-sky-400">
              <span>📊 Personal Analytics & Progress</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-[var(--foreground)]">
              Engineering Analytics <br />
              <span className="gradient-text">& Mastery Dashboard</span>
            </h1>
            <p className="text-base text-[var(--muted)] leading-relaxed">
              Track your course completion, quiz scores, interview prep drills, and active learning streaks across Almanac.
            </p>
          </div>

          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 text-center backdrop-blur-xl shrink-0 min-w-[160px] shadow-xl">
            <div className="text-4xl font-black text-amber-400 animate-pulse">🔥 {progress.streakDays || 1}</div>
            <div className="mt-1 text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">Day Active Streak</div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all hover:border-[var(--border-strong)] hover:shadow-xl">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Notes Completed</div>
          <div className="mt-3 text-3xl font-black text-[var(--foreground)]">
            {progress.completedNotes.length} <span className="text-xs font-medium text-[var(--muted)]">/ 14</span>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-[var(--surface-muted)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (progress.completedNotes.length / 14) * 100)}%` }}
            />
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all hover:border-[var(--border-strong)] hover:shadow-xl">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Quizzes Passed</div>
          <div className="mt-3 text-3xl font-black text-emerald-400">
            {totalQuizzesPassed}
          </div>
          <div className="mt-2 text-xs font-semibold text-[var(--muted)]">
            Avg Score: <span className="text-[var(--foreground)]">{avgQuizScore}%</span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all hover:border-[var(--border-strong)] hover:shadow-xl">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Interview Drills</div>
          <div className="mt-3 text-3xl font-black text-violet-400">
            {progress.interviewDrillsCount || 0}
          </div>
          <div className="mt-2 text-xs font-semibold text-[var(--muted)]">System Design Sessions</div>
        </div>

        <div className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all hover:border-[var(--border-strong)] hover:shadow-xl">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Overall Mastery</div>
          <div className="mt-3 text-3xl font-black gradient-text">
            {Math.min(100, Math.round((progress.completedNotes.length * 10) + (totalQuizzesPassed * 15)))} pts
          </div>
          <div className="mt-2 text-xs font-semibold text-[var(--muted)]">Level: <span className="text-sky-400">Architect in Training</span></div>
        </div>
      </div>

      {/* Main Grid: Category Mastery & Recommendations */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Category Progress */}
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 backdrop-blur-2xl">
          <h2 className="text-xl font-extrabold text-[var(--foreground)]">Knowledge Domain Breakdown</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Your progress tracked across core engineering domains.
          </p>

          <div className="mt-8 space-y-6">
            {CATEGORIES.map((cat) => {
              const quizScore = progress.quizScores[cat.slug] || 0;
              return (
                <div key={cat.slug} className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5 backdrop-blur-md">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5 font-bold text-[var(--foreground)]">
                      <span className="text-lg">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </div>
                    <span className="text-xs font-bold text-sky-400">
                      {quizScore > 0 ? `${quizScore}% Quiz Score` : "Not Started"}
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-[var(--surface-solid)] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-500"
                      style={{ width: `${quizScore > 0 ? quizScore : 10}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-1">
                    <span>{cat.total} Library Modules</span>
                    <Link href={`/notes?category=${cat.slug}`} className="hover:underline text-sky-400 font-bold">
                      Practice Topic →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Next Steps & Quick Launch */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-2xl space-y-4">
            <h3 className="font-extrabold text-lg text-[var(--foreground)]">🚀 Quick Action Launch</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Jump straight into learning pathways, interview drills, or notes.
            </p>

            <div className="space-y-3 pt-2">
              <Link
                href="/courses"
                className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-xs font-bold text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
              >
                <div className="flex items-center gap-2">
                  <span>🎓</span>
                  <span>Browse Courses</span>
                </div>
                <span className="text-sky-400">→</span>
              </Link>

              <Link
                href="/interview"
                className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-xs font-bold text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
              >
                <div className="flex items-center gap-2">
                  <span>🎯</span>
                  <span>Practice System Design</span>
                </div>
                <span className="text-sky-400">→</span>
              </Link>

              <Link
                href="/notes"
                className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-xs font-bold text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
              >
                <div className="flex items-center gap-2">
                  <span>📚</span>
                  <span>Explore All Notes</span>
                </div>
                <span className="text-sky-400">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

