"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllCourses, getCourseProgress, getAllInterviewPlans } from "@/lib/storage/db.js";

export default function HomeContinueLearning() {
  const [mounted, setMounted] = useState(false);
  const [activeCourses, setActiveCourses] = useState([]);
  const [activePlans, setActivePlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    let isCancelled = false;

    async function loadData() {
      try {
        const courses = await getAllCourses().catch(() => []);
        if (isCancelled) return;

        const coursesWithProgress = await Promise.all(
          (courses || []).slice(0, 2).map(async (c) => {
            const prog = await getCourseProgress(c.id).catch(() => null);
            return {
              ...c,
              progress: prog || { percentage: 0, completedLessons: [] },
            };
          })
        );
        if (isCancelled) return;
        setActiveCourses(coursesWithProgress);

        const plans = await getAllInterviewPlans().catch(() => []);
        if (isCancelled) return;
        setActivePlans((plans || []).slice(0, 2));
      } catch {
        // Safe fallback
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (!mounted || loading) {
    return null;
  }

  const hasActivity = activeCourses.length > 0 || activePlans.length > 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {hasActivity ? "Continue Learning" : "Personal Learning Engine"}
        </h2>
        {hasActivity && (
          <Link href="/dashboard" className="text-xs text-violet-400 hover:text-violet-300">
            View All in Dashboard →
          </Link>
        )}
      </div>

      {hasActivity ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {activeCourses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="group p-5 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800 rounded-lg transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-violet-400 border border-violet-900/60 bg-violet-950/40 px-2 py-0.5 rounded">
                    Course • {course.level}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    {course.progress?.percentage || 0}% Complete
                  </span>
                </div>
                <h3 className="text-base font-medium text-zinc-100 group-hover:text-violet-300 transition line-clamp-1 mb-1">
                  {course.title}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                <div className="w-2/3 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-violet-500 h-full rounded-full transition-all"
                    style={{ width: `${course.progress?.percentage || 0}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-violet-400 group-hover:text-violet-300">
                  Resume →
                </span>
              </div>
            </Link>
          ))}

          {activePlans.map((plan) => (
            <Link
              key={plan.id}
              href="/interview"
              className="group p-5 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800 rounded-lg transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 border border-emerald-900/60 bg-emerald-950/40 px-2 py-0.5 rounded">
                    Interview Prep
                  </span>
                  <span className="text-xs font-mono text-zinc-500">
                    {plan.questions?.length || 3} Questions
                  </span>
                </div>
                <h3 className="text-base font-medium text-zinc-100 group-hover:text-emerald-300 transition line-clamp-1 mb-1">
                  {plan.role}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {plan.focus || plan.overview}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-mono">
                  {plan.experienceLevel}
                </span>
                <span className="text-xs font-medium text-emerald-400 group-hover:text-emerald-300">
                  Practice Drills →
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/courses"
            className="group p-5 bg-zinc-900/30 hover:bg-zinc-900/70 border border-zinc-800/80 hover:border-violet-500/40 rounded-lg transition"
          >
            <div className="w-8 h-8 rounded-md bg-violet-950/60 border border-violet-800/50 flex items-center justify-center text-violet-400 mb-3 text-xs font-mono">
              01
            </div>
            <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-violet-300 transition mb-1">
              Start Learning Something New
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              Generate an independent, structured curriculum tailored to your exact goal, background, and time commitment.
            </p>
            <span className="text-xs font-medium text-violet-400 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Design a Course →
            </span>
          </Link>

          <Link
            href="/interview"
            className="group p-5 bg-zinc-900/30 hover:bg-zinc-900/70 border border-zinc-800/80 hover:border-emerald-500/40 rounded-lg transition"
          >
            <div className="w-8 h-8 rounded-md bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400 mb-3 text-xs font-mono">
              02
            </div>
            <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-300 transition mb-1">
              Prepare for an Interview
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              Role-specific preparation plans, graded questions (Easy to Hard), and interactive AI practice evaluations.
            </p>
            <span className="text-xs font-medium text-emerald-400 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Start Preparation →
            </span>
          </Link>
        </div>
      )}
    </section>
  );
}
