"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CategoryBadge from "@/components/CategoryBadge";
import { getAllCourses, getCourseProgress, saveCourse } from "@/lib/storage";

const GENERATION_STAGES = [
  "Analyzing prerequisites and systems architecture...",
  "Designing structured modular curriculum...",
  "Building hands-on lessons, code patterns & assessments...",
  "Cross-referencing global knowledge library...",
  "Finalizing your personalized learning path...",
];

const CURATED_TEMPLATES = [
  {
    topic: "Distributed Systems",
    level: "Advanced",
    goal: "Master consensus, replication, and fault tolerance at staff scale",
    timeCommitment: "1 hour / day",
    description: "CAP theorem, Paxos/Raft consensus, partitioned storage, and high-availability patterns.",
  },
  {
    topic: "RAG & Vector Retrieval Systems",
    level: "Intermediate",
    goal: "Build low-latency enterprise retrieval pipelines with hybrid search",
    timeCommitment: "45 mins / day",
    description: "Vector indexing, reciprocal rank fusion, context compression, and grounding evaluation.",
  },
  {
    topic: "Database Internals & Transaction Isolation",
    level: "Advanced",
    goal: "Understand storage engines, MVCC, and write-ahead logging under concurrency",
    timeCommitment: "1 hour / day",
    description: "B-Tree vs LSM-Tree, PostgreSQL MVCC, lock escalation, and write amplification mitigation.",
  },
  {
    topic: "Linux eBPF & Kernel Networking",
    level: "Advanced",
    goal: "Architect kernel-level observability and high-throughput packet filtering",
    timeCommitment: "30 mins / day",
    description: "eBPF bytecode, XDP, tracepoints, and zero-overhead telemetry.",
  },
];

export default function CoursesClient() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Course Creator Form State
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Intermediate");
  const [goal, setGoal] = useState("");
  const [timeCommitment, setTimeCommitment] = useState("1 hour / day");
  const [learningStyle, setLearningStyle] = useState("Hands-on architecture & diagrams");
  const [generating, setGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Load existing personal courses from IndexedDB
  const refreshCourses = async () => {
    try {
      const list = await getAllCourses();
      const withProg = await Promise.all(
        list.map(async (c) => {
          const prog = await getCourseProgress(c.id);
          return {
            ...c,
            progress: prog || { percentage: 0, completedLessons: [] },
          };
        })
      );
      setCourses(withProg);
    } catch {
      // IndexedDB fallback
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    refreshCourses();
  }, []);

  // Meaningful generation stage progression during generation
  useEffect(() => {
    let interval = null;
    if (generating) {
      setGenerationStage(0);
      interval = setInterval(() => {
        setGenerationStage((prev) => (prev < GENERATION_STAGES.length - 1 ? prev + 1 : prev));
      }, 1600);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [generating]);

  const handleGenerateCourse = async (e) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/courses/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          level,
          goal: goal.trim(),
          timeCommitment,
          learningStyle,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate course. Please try again.");
      }

      const courseData = await res.json();
      if (!courseData || !courseData.id) {
        throw new Error("Invalid course structure received.");
      }

      // Persist in local-first storage
      await saveCourse(courseData);
      await refreshCourses();

      // Navigate to the newly generated course
      router.push(`/courses/${courseData.id}`);
    } catch (err) {
      setError(err.message || "An error occurred while generating the course.");
      setGenerating(false);
    }
  };

  const handleSelectTemplate = (template) => {
    setTopic(template.topic);
    setLevel(template.level);
    setGoal(template.goal);
    setTimeCommitment(template.timeCommitment);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-violet-400">
            Personal Learning Engine
          </span>
          <span className="text-zinc-600">•</span>
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
            isOnline
              ? "border-emerald-900/60 bg-emerald-950/40 text-emerald-400"
              : "border-amber-900/60 bg-amber-950/40 text-amber-400"
          }`}>
            {isOnline ? "Online (AI Generator Active)" : "Offline (Saved Courses Available)"}
          </span>
        </div>
        <h1 className="text-3xl font-semibold text-zinc-100 tracking-tight">
          Engineering Courses &amp; Curricula
        </h1>
        <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
          Courses in Almanac are independent, custom curricula generated for your background and goals.
          Modules include internal mechanics, code patterns, practical exercises, and recall assessments — stored local-first for offline study.
        </p>
      </div>

      {/* Course Creator Form */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 space-y-6">
        <div className="space-y-1 border-b border-zinc-800/80 pb-4">
          <h2 className="text-lg font-medium text-zinc-100">
            Design a Custom Learning Path
          </h2>
          <p className="text-xs text-zinc-400">
            Enter any engineering topic. Our Learning Planner will analyze prerequisites and design a multi-module syllabus.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-rose-800/60 bg-rose-950/40 p-3.5 text-xs text-rose-300">
            {error}
          </div>
        )}

        {generating ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-5 text-center">
            <div className="relative w-12 h-12">
              <div className="w-12 h-12 rounded-full border-2 border-violet-500/20 border-t-violet-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-violet-400">
                AI
              </div>
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-sm font-semibold text-zinc-200">
                Building Your Engineering Course
              </h3>
              <p className="text-xs text-violet-400 font-mono transition-all">
                {GENERATION_STAGES[generationStage]}
              </p>
              <p className="text-[11px] text-zinc-500 pt-2">
                Designing modules, verifying invariants, formulating code examples &amp; exercises.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerateCourse} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Topic Input */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-zinc-300">
                  What do you want to master? <span className="text-violet-400">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Distributed Consensus & Raft, Vector Database Internals, PostgreSQL MVCC..."
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                  required
                />
              </div>

              {/* Target Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Target Experience Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Beginner", "Intermediate", "Advanced"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(lvl)}
                      className={`rounded-md border py-2 text-xs font-medium transition cursor-pointer ${
                        level === lvl
                          ? "border-violet-600 bg-violet-950/60 text-violet-300"
                          : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Commitment */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Time Commitment (Optional)
                </label>
                <input
                  type="text"
                  value={timeCommitment}
                  onChange={(e) => setTimeCommitment(e.target.value)}
                  placeholder="e.g. 30 mins / day, 4 hours / week"
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                />
              </div>

              {/* Specific Goal */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-medium text-zinc-300">
                  Your Primary Learning Goal (Optional)
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. Prepare for Staff System Design interview, build a high-throughput streaming engine..."
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/60">
              <span className="text-[11px] text-zinc-500 font-mono">
                {isOnline ? "AI Generation Engine Ready" : "Network required to generate new courses"}
              </span>
              <button
                type="submit"
                disabled={generating || !topic.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-violet-600 px-5 py-2.5 text-xs font-medium text-white transition hover:bg-violet-500 disabled:opacity-50 cursor-pointer"
              >
                <span>Generate Learning Path</span>
                <span>→</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* My Learning Tracks (IndexedDB Personal Storage) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              My Learning Tracks
            </h2>
            <p className="text-[11px] text-zinc-500">
              Generated courses saved local-first to your browser. Fully functional offline.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {courses.length} {courses.length === 1 ? "Course" : "Courses"}
          </span>
        </div>

        {loadingCourses ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-mono">
            Loading local personal learning tracks...
          </div>
        ) : courses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map((course) => {
              const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
              const completedCount = course.progress?.completedLessons?.length || 0;
              const pct = course.progress?.percentage || 0;

              return (
                <div
                  key={course.id}
                  className="group flex flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 p-5 hover:border-zinc-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400 border border-violet-900/60 bg-violet-950/40 px-2 py-0.5 rounded">
                        {course.level}
                      </span>
                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                        <span className="text-emerald-400 text-[10px]">● Offline Ready</span>
                        <span>•</span>
                        <span>{course.estimatedDuration || "6 hours"}</span>
                      </div>
                    </div>

                    <h3 className="text-base font-medium text-zinc-100 group-hover:text-violet-300 transition line-clamp-1 mb-1.5">
                      {course.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-800/70 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-500">Progress</span>
                      <span className="text-zinc-300 font-medium">
                        {completedCount} / {totalLessons} Lessons ({pct}%)
                      </span>
                    </div>

                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-violet-500 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500">
                        {course.modules?.length || 0} Modules
                      </span>
                      <Link
                        href={`/courses/${course.id}`}
                        className="text-xs font-medium text-violet-400 hover:text-violet-300 inline-flex items-center gap-1"
                      >
                        <span>{pct === 100 ? "Review Course" : "Continue Track"}</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center space-y-2">
            <p className="text-xs text-zinc-400">
              You haven&apos;t generated any courses yet.
            </p>
            <p className="text-[11px] text-zinc-500">
              Pick a topic above or select one of the recommended engineering tracks below.
            </p>
          </div>
        )}
      </section>

      {/* Curated Recommendations */}
      <section className="space-y-4 border-t border-zinc-800 pt-8">
        <div className="space-y-0.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Recommended Foundational Tracks
          </h2>
          <p className="text-[11px] text-zinc-500">
            Staff-curated curriculum blueprints ready to be customized and generated into your personal library.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {CURATED_TEMPLATES.map((tmpl, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-5 hover:border-zinc-700 transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded">
                    {tmpl.level}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">{tmpl.timeCommitment}</span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 mb-1">
                  {tmpl.topic}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500 line-clamp-1 max-w-[200px]">
                  Goal: {tmpl.goal}
                </span>
                <button
                  onClick={() => handleSelectTemplate(tmpl)}
                  className="text-xs font-medium text-violet-400 hover:text-violet-300 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Select &amp; Customize</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
