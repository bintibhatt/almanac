"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import CodeBlock from "@/components/CodeBlock";
import { getCourse, getCourseProgress, markLessonComplete, updateActiveLesson } from "@/lib/storage";

export default function CoursePlayerClient() {
  const { id } = useParams();
  const router = useRouter();

  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Interactive Lesson States
  const [showSolution, setShowSolution] = useState({});
  const [showHint, setShowHint] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({});

  useEffect(() => {
    async function loadCourseData() {
      try {
        const stored = await getCourse(id);
        if (stored) {
          setCourse(stored);
          const prog = await getCourseProgress(id);
          setProgress(prog);

          const defaultActive =
            prog?.activeLessonId || stored.modules?.[0]?.lessons?.[0]?.id || null;
          setActiveLessonId(defaultActive);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadCourseData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center font-mono text-xs text-zinc-500">
        Loading local course data...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-xl font-semibold text-zinc-200">Course Not Found</h1>
        <p className="text-xs text-zinc-400">
          This course may not have been saved in your browser&apos;s local storage yet.
        </p>
        <Link
          href="/courses"
          className="inline-flex rounded-md bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500"
        >
          Return to Courses Directory
        </Link>
      </div>
    );
  }

  // Find all lessons flattened
  const allLessons = [];
  course.modules?.forEach((mod) => {
    mod.lessons?.forEach((les) => {
      allLessons.push({ ...les, moduleTitle: mod.title });
    });
  });

  const activeLesson =
    allLessons.find((l) => l.id === activeLessonId) || allLessons[0];
  const activeIndex = allLessons.findIndex((l) => l.id === activeLesson?.id);
  const nextLesson = activeIndex >= 0 && activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;
  const prevLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;

  const isCompleted = (lessonId) =>
    Boolean(progress?.completedLessons?.includes(lessonId));

  const handleSelectLesson = async (lessonId) => {
    setActiveLessonId(lessonId);
    setShowSolution({});
    setShowHint({});
    setSelectedAnswers({});
    setSubmittedAnswers({});
    await updateActiveLesson(course.id, lessonId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCompleteAndNext = async () => {
    if (!activeLesson) return;
    await markLessonComplete(course.id, activeLesson.id);

    const updatedProg = await getCourseProgress(course.id);
    setProgress(updatedProg);

    if (nextLesson) {
      handleSelectLesson(nextLesson.id);
    }
  };

  const toggleHint = (exId) => {
    setShowHint((prev) => ({ ...prev, [exId]: !prev[exId] }));
  };

  const toggleSolution = (exId) => {
    setShowSolution((prev) => ({ ...prev, [exId]: !prev[exId] }));
  };

  const handleSelectOption = (qId, optionIdx) => {
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleSubmitQuiz = (qId) => {
    setSubmittedAnswers((prev) => ({ ...prev, [qId]: true }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Breadcrumb & Progress Header */}
      <div className="border-b border-zinc-800 pb-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <Link
            href="/courses"
            className="text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1 font-medium"
          >
            <span>← Courses</span>
          </Link>
          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
            <span className="text-emerald-400">● Offline Ready</span>
            <span>•</span>
            <span>{course.level}</span>
            <span>•</span>
            <span>{course.estimatedDuration}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100">
              {course.title}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {course.description}
            </p>
          </div>

          <div className="shrink-0 space-y-1.5 min-w-[200px]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Curriculum Progress</span>
              <span className="text-violet-400 font-semibold">{progress?.percentage || 0}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-violet-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress?.percentage || 0}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-zinc-500 block text-right">
              {progress?.completedLessons?.length || 0} of {allLessons.length} lessons completed
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar Syllabus + Lesson Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Syllabus Sidebar */}
        <aside className="lg:col-span-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-5 lg:sticky lg:top-20">
          <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Curriculum Syllabus
            </h2>
            <span className="text-[11px] font-mono text-zinc-500">
              {course.modules?.length || 0} Modules
            </span>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {course.modules?.map((mod, modIdx) => (
              <div key={mod.id} className="space-y-2">
                <div className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
                  {mod.title}
                </div>
                <div className="space-y-1">
                  {mod.lessons?.map((les) => {
                    const active = les.id === activeLesson?.id;
                    const done = isCompleted(les.id);

                    return (
                      <button
                        key={les.id}
                        onClick={() => handleSelectLesson(les.id)}
                        className={`w-full text-left rounded-md px-3 py-2 text-xs transition flex items-start justify-between gap-2 cursor-pointer ${
                          active
                            ? "bg-violet-950/60 text-violet-200 border border-violet-800/80 font-medium"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 shrink-0 font-mono text-[11px]">
                            {done ? (
                              <span className="text-emerald-400">✓</span>
                            ) : active ? (
                              <span className="text-violet-400">→</span>
                            ) : (
                              <span className="text-zinc-600">○</span>
                            )}
                          </span>
                          <span className="line-clamp-2 leading-relaxed">
                            {les.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 shrink-0 mt-0.5">
                          {les.estimatedMinutes}m
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right: Active Lesson View */}
        <main className="lg:col-span-8 space-y-8">
          {activeLesson ? (
            <div className="space-y-8">
              {/* Lesson Metadata Banner */}
              <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono text-zinc-500">
                    {activeLesson.moduleTitle}
                  </span>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-violet-400 border border-violet-900/60 bg-violet-950/40 px-2 py-0.5 rounded">
                      {activeLesson.difficulty}
                    </span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-400">{activeLesson.estimatedMinutes} mins</span>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100">
                  {activeLesson.title}
                </h2>

                {activeLesson.objective && (
                  <div className="mt-3 rounded-lg border border-violet-800/40 bg-violet-950/20 p-3.5 text-xs text-violet-300 leading-relaxed">
                    <span className="font-semibold text-violet-200 uppercase tracking-wider font-mono mr-2">
                      Objective:
                    </span>
                    {activeLesson.objective}
                  </div>
                )}
              </div>

              {/* Technical Explanation */}
              <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 sm:p-8">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                  01. Technical Explanation &amp; Architecture
                </h3>
                <div className="text-zinc-300 text-sm leading-relaxed space-y-4">
                  <MarkdownRenderer content={activeLesson.explanation} />
                </div>
              </div>

              {/* Core Concepts Breakdown */}
              {activeLesson.concepts && activeLesson.concepts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                    02. Core Mental Models &amp; Invariants
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {activeLesson.concepts.map((concept, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-2"
                      >
                        <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                          {concept.name}
                        </h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {concept.explanation}
                        </p>
                        {concept.keyTakeaway && (
                          <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-violet-300 font-mono">
                            Rule of Thumb: {concept.keyTakeaway}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Examples */}
              {activeLesson.codeExamples && activeLesson.codeExamples.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                    03. Production Code &amp; Implementation Patterns
                  </h3>
                  <div className="space-y-4">
                    {activeLesson.codeExamples.map((ex, idx) => (
                      <div key={idx} className="rounded-xl border border-zinc-800 overflow-hidden">
                        <div className="bg-zinc-950 px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-xs">
                          <span className="font-medium text-zinc-300">{ex.title}</span>
                          <span className="font-mono text-zinc-500 uppercase text-[10px]">
                            {ex.language}
                          </span>
                        </div>
                        <CodeBlock language={ex.language} value={ex.code} />
                        {ex.explanation && (
                          <div className="bg-zinc-950/90 p-3.5 border-t border-zinc-800 text-xs text-zinc-400 leading-relaxed">
                            {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hands-On Practical Exercises */}
              {activeLesson.practicalExercises && activeLesson.practicalExercises.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                    04. Architecture Drill &amp; Hands-On Exercise
                  </h3>
                  <div className="space-y-4">
                    {activeLesson.practicalExercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono uppercase text-violet-400">
                            Practical Exercise
                          </span>
                          <h4 className="text-sm font-semibold text-zinc-100">
                            {exercise.title}
                          </h4>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {exercise.prompt}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          {exercise.hints && exercise.hints.length > 0 && (
                            <button
                              onClick={() => toggleHint(exercise.id)}
                              className="text-xs text-zinc-400 hover:text-zinc-200 underline font-mono cursor-pointer"
                            >
                              {showHint[exercise.id] ? "Hide Hint" : "Need a Hint?"}
                            </button>
                          )}
                          <button
                            onClick={() => toggleSolution(exercise.id)}
                            className="text-xs text-violet-400 hover:text-violet-300 font-mono cursor-pointer"
                          >
                            {showSolution[exercise.id] ? "Hide Solution" : "Reveal Architectural Solution →"}
                          </button>
                        </div>

                        {showHint[exercise.id] && exercise.hints && (
                          <div className="rounded-md border border-amber-900/50 bg-amber-950/30 p-3 text-xs text-amber-300 space-y-1 font-mono">
                            <span className="font-semibold uppercase text-[10px]">Hints:</span>
                            <ul className="list-disc pl-4 space-y-0.5">
                              {exercise.hints.map((h, i) => (
                                <li key={i}>{h}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {showSolution[exercise.id] && (
                          <div className="rounded-md border border-emerald-900/60 bg-emerald-950/30 p-4 text-xs text-emerald-200 space-y-1 leading-relaxed">
                            <span className="font-semibold uppercase font-mono text-[10px] text-emerald-400 block mb-1">
                              Architectural Solution:
                            </span>
                            {exercise.solution}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comprehension Assessment Question */}
              {activeLesson.assessment && activeLesson.assessment.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                    05. Comprehension Assessment &amp; Recall
                  </h3>
                  <div className="space-y-4">
                    {activeLesson.assessment.map((q) => {
                      const selected = selectedAnswers[q.id];
                      const submitted = submittedAnswers[q.id];
                      const isCorrect = selected === q.correctIndex;

                      return (
                        <div
                          key={q.id}
                          className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5 space-y-4"
                        >
                          <h4 className="text-xs sm:text-sm font-medium text-zinc-200">
                            {q.question}
                          </h4>

                          <div className="space-y-2">
                            {q.options?.map((opt, optIdx) => {
                              const isThisSelected = selected === optIdx;
                              let style = "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700";

                              if (submitted) {
                                if (optIdx === q.correctIndex) {
                                  style = "border-emerald-800 bg-emerald-950/60 text-emerald-200 font-medium";
                                } else if (isThisSelected) {
                                  style = "border-rose-800 bg-rose-950/60 text-rose-300";
                                } else {
                                  style = "border-zinc-800/40 text-zinc-600 opacity-60";
                                }
                              } else if (isThisSelected) {
                                style = "border-violet-600 bg-violet-950/60 text-violet-200 font-medium";
                              }

                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => !submitted && handleSelectOption(q.id, optIdx)}
                                  className={`w-full text-left rounded-md border p-3 text-xs transition flex items-center justify-between cursor-pointer ${style}`}
                                >
                                  <span>{opt}</span>
                                  {submitted && optIdx === q.correctIndex && (
                                    <span className="text-emerald-400 text-xs font-bold">✓</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {!submitted ? (
                            <button
                              onClick={() => handleSubmitQuiz(q.id)}
                              disabled={selected === undefined}
                              className="rounded-md bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 text-xs px-4 py-2 font-medium transition cursor-pointer"
                            >
                              Check Answer
                            </button>
                          ) : (
                            <div className="pt-2 text-xs space-y-1">
                              <span className={isCorrect ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                                {isCorrect ? "✓ Correct!" : "✗ Incorrect."}
                              </span>
                              <p className="text-zinc-400 leading-relaxed">
                                {q.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Common Pitfalls */}
              {activeLesson.commonMistakes && activeLesson.commonMistakes.length > 0 && (
                <div className="rounded-xl border border-rose-900/30 bg-rose-950/15 p-5 space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-300 font-mono">
                    Common Production Pitfalls to Avoid
                  </h4>
                  <ul className="list-disc pl-5 text-xs text-rose-200/90 space-y-1">
                    {activeLesson.commonMistakes.map((pitfall, idx) => (
                      <li key={idx}>{pitfall}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Checkpoint */}
              {activeLesson.checkpoint && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-violet-400 tracking-wider">
                    Lesson Checkpoint
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {activeLesson.checkpoint}
                  </p>
                </div>
              )}

              {/* Supplementary Almanac Knowledge Notes */}
              {activeLesson.relatedNotes && activeLesson.relatedNotes.length > 0 && (
                <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase text-violet-400">
                      Supplementary Resources
                    </span>
                    <h4 className="text-xs font-semibold text-zinc-200">
                      Related Almanac Knowledge Library Notes
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      These global knowledge notes are supplementary reading and not required to complete this course.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 pt-1">
                    {activeLesson.relatedNotes.map((note, idx) => (
                      <Link
                        key={idx}
                        href={`/notes/${note.slug}`}
                        target="_blank"
                        className="group flex items-center justify-between p-3 rounded-md border border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 transition"
                      >
                        <span className="text-xs text-zinc-300 group-hover:text-violet-300 transition truncate pr-2">
                          {note.title}
                        </span>
                        <span className="text-zinc-600 group-hover:text-violet-400 text-xs">
                          ↗
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Lesson Completion Navigation Footer */}
              <div className="pt-6 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {prevLesson ? (
                  <button
                    onClick={() => handleSelectLesson(prevLesson.id)}
                    className="text-xs text-zinc-400 hover:text-zinc-200 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>← Previous:</span>
                    <span className="truncate max-w-[200px]">{prevLesson.title}</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  onClick={handleCompleteAndNext}
                  className="rounded-md bg-violet-600 px-5 py-2.5 text-xs font-medium text-white hover:bg-violet-500 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-violet-950/50"
                >
                  <span>
                    {isCompleted(activeLesson.id)
                      ? nextLesson
                        ? "Continue to Next Lesson"
                        : "Finish Course"
                      : "Mark Lesson Complete & Continue"}
                  </span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-zinc-500">
              Select a lesson from the syllabus on the left to begin.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
