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
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-12 backdrop-blur-2xl">
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3.5 py-1 text-xs font-mono text-[var(--muted-light)]">
              <span>Personal Analytics & Progress</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-[var(--foreground)]">
              Engineering Analytics <br />
              <span className="gradient-text font-normal">& Mastery Dashboard</span>
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              Track course completion, quiz scores, interview prep drills, and active learning streaks across Almanac.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-5 text-center shrink-0 min-w-[160px] shadow-sm">
            <div className="text-3xl font-extrabold text-[var(--foreground)] font-mono">{progress.streakDays || 1} Days</div>
            <div className="mt-1 text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider">Active Streak</div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all hover:border-[var(--border-strong)]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">Notes Completed</div>
          <div className="mt-3 text-3xl font-bold text-[var(--foreground)]">
            {progress.completedNotes.length} <span className="text-xs font-normal text-[var(--muted)]">/ 14</span>
          </div>
          <div className="mt-4 h-1.5 w-full rounded-full bg-[var(--surface-muted)] overflow-hidden">
            <div
              className="h-full bg-[var(--foreground)] transition-all duration-500"
              style={{ width: `${Math.min(100, (progress.completedNotes.length / 14) * 100)}%` }}
            />
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all hover:border-[var(--border-strong)]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">Quizzes Passed</div>
          <div className="mt-3 text-3xl font-bold text-[var(--foreground)]">
            {totalQuizzesPassed}
          </div>
          <div className="mt-2 text-xs font-medium text-[var(--muted)]">
            Avg Score: <span className="text-[var(--foreground)]">{avgQuizScore}%</span>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all hover:border-[var(--border-strong)]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">Interview Drills</div>
          <div className="mt-3 text-3xl font-bold text-[var(--foreground)]">
            {progress.interviewDrillsCount || 0}
          </div>
          <div className="mt-2 text-xs font-medium text-[var(--muted)]">System Design Sessions</div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all hover:border-[var(--border-strong)]">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">Overall Mastery</div>
          <div className="mt-3 text-3xl font-bold text-[var(--foreground)]">
            {Math.min(100, Math.round((progress.completedNotes.length * 10) + (totalQuizzesPassed * 15)))} <span className="text-xs font-normal text-[var(--muted)]">pts</span>
          </div>
          <div className="mt-2 text-xs font-medium text-[var(--muted)]">Level: <span className="text-[var(--foreground)] font-medium">Architect Level</span></div>
        </div>
      </div>

      {/* Main Grid: Category Mastery & Recommendations */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Category Progress */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 backdrop-blur-2xl">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Knowledge Domain Breakdown</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Your progress tracked across core engineering domains.
          </p>

          <div className="mt-8 space-y-5">
            {CATEGORIES.map((cat) => {
              const quizScore = progress.quizScores[cat.slug] || 0;
              return (
                <div key={cat.slug} className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-semibold text-[var(--foreground)]">
                      {cat.label}
                    </div>
                    <span className="font-mono text-[var(--muted)]">
                      {quizScore > 0 ? `${quizScore}% Score` : "Not Started"}
                    </span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-[var(--surface-solid)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--foreground)] opacity-90 transition-all duration-500"
                      style={{ width: `${quizScore > 0 ? quizScore : 10}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[var(--muted)] pt-1">
                    <span>{cat.total} Library Modules</span>
                    <Link href={`/notes?category=${cat.slug}`} className="hover:underline text-[var(--foreground)] font-medium">
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
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-2xl space-y-4">
            <h3 className="font-bold text-base text-[var(--foreground)]">Quick Launch</h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Jump straight into learning pathways, interview drills, or notes.
            </p>

            <div className="space-y-2.5 pt-2">
              <Link
                href="/courses"
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] p-3.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
              >
                <span>Browse Courses</span>
                <span className="text-[var(--muted)]">→</span>
              </Link>

              <Link
                href="/interview"
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] p-3.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
              >
                <span>Practice System Design</span>
                <span className="text-[var(--muted)]">→</span>
              </Link>

              <Link
                href="/notes"
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] p-3.5 text-xs font-semibold text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
              >
                <span>Explore All Notes</span>
                <span className="text-[var(--muted)]">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


