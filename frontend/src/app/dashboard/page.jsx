"use client";

import Link from "next/link";
import { useProgress } from "@/hooks/useProgress";
import CategoryBadge from "@/components/CategoryBadge";

const CATEGORIES = [
  { slug: "ai", label: "AI & RAG Systems", icon: "🤖", total: 3 },
  { slug: "system-design", label: "Distributed Systems", icon: "🌐", total: 2 },
  { slug: "backend", label: "Backend Performance", icon: "⚡", total: 4 },
  { slug: "security", label: "Web Security & TLS", icon: "🔒", total: 1 },
];

export default function DashboardPage() {
  const { progress, isLoaded } = useProgress();

  const totalQuizzesPassed = Object.values(progress.quizScores).filter((s) => s >= 70).length;
  const avgQuizScore =
    Object.keys(progress.quizScores).length > 0
      ? Math.round(
          Object.values(progress.quizScores).reduce((a, b) => a + b, 0) /
            Object.keys(progress.quizScores).length
        )
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Header */}
      <div className="border-b border-[var(--border)] pb-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-[var(--surface-muted)] px-3.5 py-1 text-xs font-semibold text-[var(--accent)]">
              Personalized Learning Hub
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
              Engineering Analytics & Mastery
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-[var(--muted)]">
              Track your course completion, quiz scores, interview prep drills, and active learning streaks across Almanac.
            </p>
          </div>

          <div className="hidden sm:block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-center min-w-[140px]">
            <div className="text-3xl font-black text-[var(--accent)]">🔥 {progress.streakDays || 1}</div>
            <div className="mt-1 text-xs font-medium text-[var(--muted)]">Day Learning Streak</div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="text-sm font-medium text-[var(--muted)]">Notes Completed</div>
          <div className="mt-2 text-3xl font-bold text-[var(--foreground)]">
            {progress.completedNotes.length} <span className="text-xs font-normal text-[var(--muted)]">/ 14</span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-[var(--surface-muted)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-500"
              style={{ width: `${Math.min(100, (progress.completedNotes.length / 14) * 100)}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="text-sm font-medium text-[var(--muted)]">Quizzes Passed</div>
          <div className="mt-2 text-3xl font-bold text-[var(--foreground)]">
            {totalQuizzesPassed}
          </div>
          <div className="mt-2 text-xs text-[var(--muted)]">
            Average Score: <span className="font-semibold text-[var(--foreground)]">{avgQuizScore}%</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="text-sm font-medium text-[var(--muted)]">Interview Drills</div>
          <div className="mt-2 text-3xl font-bold text-[var(--foreground)]">
            {progress.interviewDrillsCount || 0}
          </div>
          <div className="mt-2 text-xs text-[var(--muted)]">System Design Sessions</div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="text-sm font-medium text-[var(--muted)]">Overall Mastery</div>
          <div className="mt-2 text-3xl font-bold text-[var(--accent)]">
            {Math.min(100, Math.round((progress.completedNotes.length * 10) + (totalQuizzesPassed * 15)))} pts
          </div>
          <div className="mt-2 text-xs text-[var(--muted)]">Level: <span className="font-semibold text-[var(--foreground)]">Architect in Training</span></div>
        </div>
      </div>

      {/* Main Grid: Category Mastery & Recommendations */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Category Progress */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[var(--foreground)]">Knowledge Domain Breakdown</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Your progress tracked across core engineering domains.
          </p>

          <div className="mt-6 space-y-6">
            {CATEGORIES.map((cat) => {
              const quizScore = progress.quizScores[cat.slug] || 0;
              return (
                <div key={cat.slug} className="space-y-2 border-b border-[var(--border)] pb-5 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 font-semibold">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-[var(--accent)]">
                      {quizScore > 0 ? `${quizScore}% Quiz Score` : "Not Started"}
                    </span>
                  </div>

                  <div className="h-2.5 w-full rounded-full bg-[var(--surface-muted)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--foreground)] transition-all duration-500"
                      style={{ width: `${quizScore > 0 ? quizScore : 10}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>{cat.total} Library Modules</span>
                    <Link href={`/notes?category=${cat.slug}`} className="hover:underline text-[var(--accent)] font-medium">
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
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="font-bold text-lg text-[var(--foreground)]">🚀 Quick Action Launch</h3>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Jump straight into learning or testing your skills.
            </p>

            <div className="mt-5 space-y-3">
              <Link
                href="/courses"
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--border-strong)]"
              >
                <span>🎓 Browse Courses</span>
                <span>→</span>
              </Link>

              <Link
                href="/interview"
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--border-strong)]"
              >
                <span>🎯 Practice System Design</span>
                <span>→</span>
              </Link>

              <Link
                href="/notes"
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--border-strong)]"
              >
                <span>📚 Explore All Notes</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
