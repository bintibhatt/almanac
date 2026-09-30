"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import {
  getAllInterviewPlans,
  saveInterviewPlan,
  saveInterviewSession,
  getInterviewSessions,
} from "@/lib/storage";

const GENERATION_STAGES = [
  "Analyzing role requirements & competencies...",
  "Formulating domain skill/topic matrix...",
  "Generating graded questions across difficulty tiers...",
  "Synthesizing production scenarios & evaluation rubrics...",
  "Finalizing personalized interview preparation plan...",
];

const PRESET_ROLES = [
  {
    role: "Backend Software Engineer",
    experienceLevel: "Senior (5-8 yrs)",
    focus: "Distributed Systems, Databases & Concurrency",
    company: "High-Scale Tech",
  },
  {
    role: "Applied AI Engineer",
    experienceLevel: "Mid-Level (2-4 yrs)",
    focus: "RAG Systems, Vector Search & Inference Latency",
    company: "AI Platform",
  },
  {
    role: "Data & Storage Systems Engineer",
    experienceLevel: "Senior (5-8 yrs)",
    focus: "LSM-Trees, Transaction Isolation & Kafka Streams",
    company: "Data Infrastructure",
  },
  {
    role: "Site Reliability / DevOps Engineer",
    experienceLevel: "Senior (5-8 yrs)",
    focus: "Kubernetes Internals, eBPF & Incident Triage",
    company: "Cloud Infrastructure",
  },
];

export default function InterviewPage() {
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Creation Form State
  const [role, setRole] = useState("Backend Software Engineer");
  const [experienceLevel, setExperienceLevel] = useState("Senior (5-8 yrs)");
  const [focus, setFocus] = useState("System Design, Databases & Scalability");
  const [company, setCompany] = useState("");
  const [questionCount, setQuestionCount] = useState(6);
  const [generating, setGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);
  const [genError, setGenError] = useState(null);

  // Active Practice Session State
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [pastSessions, setPastSessions] = useState([]);

  // Load plans from IndexedDB
  const refreshPlans = async () => {
    try {
      const list = await getAllInterviewPlans();
      setPlans(list);
      if (list.length > 0 && !activePlan) {
        setActivePlan(list[0]);
        if (list[0].questions?.length > 0) {
          setActiveQuestion(list[0].questions[0]);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    refreshPlans();
  }, []);

  // Meaningful stage progression during plan generation
  useEffect(() => {
    let interval = null;
    if (generating) {
      setGenerationStage(0);
      interval = setInterval(() => {
        setGenerationStage((prev) => (prev < GENERATION_STAGES.length - 1 ? prev + 1 : prev));
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [generating]);

  // Load past practice sessions for active plan
  useEffect(() => {
    async function loadSessions() {
      if (activePlan) {
        try {
          const sessions = await getInterviewSessions(activePlan.id);
          setPastSessions(sessions);
        } catch {
          setPastSessions([]);
        }
      }
    }
    loadSessions();
  }, [activePlan]);

  const handleGeneratePlan = async (e) => {
    if (e) e.preventDefault();
    if (!role.trim()) return;

    setGenerating(true);
    setGenError(null);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "plan",
          role: role.trim(),
          experienceLevel,
          focus: focus.trim(),
          company: company.trim(),
          questionCount,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate interview plan.");

      const planData = await res.json();
      if (!planData || !planData.id) throw new Error("Invalid plan data received.");

      await saveInterviewPlan(planData);
      await refreshPlans();

      setActivePlan(planData);
      if (planData.questions?.length > 0) {
        setActiveQuestion(planData.questions[0]);
      }
      setUserAnswer("");
      setEvaluation(null);
      setShowModelAnswer(false);
    } catch (err) {
      setGenError(err.message || "Failed to generate interview plan.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectQuestion = (q) => {
    setActiveQuestion(q);
    setUserAnswer("");
    setEvaluation(null);
    setShowModelAnswer(false);

    // If there's an existing session for this question, load it
    const existing = pastSessions.find((s) => s.questionId === q.id);
    if (existing) {
      setUserAnswer(existing.userAnswer || "");
      setEvaluation(existing.evaluation || null);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!activeQuestion || !userAnswer.trim() || evaluating) return;
    setEvaluating(true);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          question: activeQuestion.question,
          modelAnswer: activeQuestion.modelAnswer,
          userAnswer: userAnswer.trim(),
          role: activePlan?.role || role,
        }),
      });

      if (!res.ok) throw new Error("Evaluation failed.");

      const evalData = await res.json();
      setEvaluation(evalData);

      // Save to IndexedDB
      await saveInterviewSession({
        planId: activePlan?.id || "default-plan",
        questionId: activeQuestion.id,
        questionText: activeQuestion.question,
        userAnswer: userAnswer.trim(),
        evaluation: evalData,
      });

      const updated = await getInterviewSessions(activePlan?.id);
      setPastSessions(updated);
    } catch (err) {
      console.warn("Evaluation error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  // Filter questions for active plan
  const filteredQuestions = (activePlan?.questions || []).filter((q) => {
    if (filterDifficulty !== "all" && q.difficulty?.toLowerCase() !== filterDifficulty.toLowerCase()) {
      return false;
    }
    if (filterCategory !== "all" && q.category?.toLowerCase() !== filterCategory.toLowerCase()) {
      return false;
    }
    return true;
  });

  const uniqueCategories = Array.from(
    new Set((activePlan?.questions || []).map((q) => q.category).filter(Boolean))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
            Interview Preparation Engine
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-[11px] font-mono text-zinc-500">
            Role-Based Planning &amp; AI Evaluation
          </span>
        </div>
        <h1 className="text-3xl font-semibold text-zinc-100 tracking-tight">
          System Design &amp; Technical Interview Prep
        </h1>
        <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
          Prepare for engineering interviews with independently generated role plans, tiered question banks
          (Easy to Hard), and interactive AI evaluation of your architectural tradeoffs.
        </p>
      </div>

      {/* Plan Creator Form */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 space-y-6">
        <div className="space-y-1 border-b border-zinc-800/80 pb-4">
          <h2 className="text-lg font-medium text-zinc-100">
            Generate Interview Preparation Plan
          </h2>
          <p className="text-xs text-zinc-400">
            Customize target role, seniority level, and technical domains to formulate a focused practice syllabus.
          </p>
        </div>

        {genError && (
          <div className="rounded-md border border-rose-800/60 bg-rose-950/40 p-3.5 text-xs text-rose-300">
            {genError}
          </div>
        )}

        {generating ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-5 text-center">
            <div className="relative w-12 h-12">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-emerald-400">
                SD
              </div>
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-sm font-semibold text-zinc-200">
                Formulating Interview Plan
              </h3>
              <p className="text-xs text-emerald-400 font-mono transition-all">
                {GENERATION_STAGES[generationStage]}
              </p>
              <p className="text-[11px] text-zinc-500 pt-2">
                Structuring technical questions, scenarios, model rubrics &amp; failure domains.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGeneratePlan} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Target Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Target Engineering Role <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Backend Software Engineer, Distributed Systems Engineer..."
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              {/* Experience Level */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Seniority Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="Junior (0-2 yrs)">Junior (0-2 yrs)</option>
                  <option value="Mid-Level (2-4 yrs)">Mid-Level (2-4 yrs)</option>
                  <option value="Senior (5-8 yrs)">Senior (5-8 yrs)</option>
                  <option value="Staff / Principal (8+ yrs)">Staff / Principal (8+ yrs)</option>
                </select>
              </div>

              {/* Target Focus */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Target Technologies / Focus Domains
                </label>
                <input
                  type="text"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="e.g. System Design, Databases, Kafka, Raft, Go, Concurrency"
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Optional Company Context */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Target Company Context (Optional)
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe, Datadog, Google, Scale AI"
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Number of Questions to Generate */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">
                    Number of Questions to Generate
                  </label>
                  <span className="text-emerald-400 font-mono text-xs font-medium">
                    {questionCount} Questions Selected
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {[3, 5, 6, 8, 10, 12, 15].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer border ${
                        questionCount === num
                          ? "border-emerald-500 bg-emerald-950/60 text-emerald-300 font-semibold shadow-sm"
                          : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      {num} Questions
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 sm:ml-auto">
                    <span className="text-[11px] text-zinc-500 font-mono">Custom:</span>
                    <input
                      type="number"
                      min={3}
                      max={15}
                      value={questionCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setQuestionCount(Math.max(3, Math.min(15, val)));
                      }}
                      className="w-14 rounded border border-zinc-800 bg-zinc-950 py-1 text-center text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-zinc-600 font-mono">(3-15)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-2 border-t border-zinc-800/60">
              <span className="text-[11px] font-mono text-zinc-500 mr-2">Presets:</span>
              <div className="inline-flex flex-wrap gap-2 pt-1">
                {PRESET_ROLES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setRole(preset.role);
                      setExperienceLevel(preset.experienceLevel);
                      setFocus(preset.focus);
                      setCompany(preset.company);
                    }}
                    className="text-[11px] rounded border border-zinc-800 bg-zinc-950/60 px-2 py-1 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 cursor-pointer"
                  >
                    {preset.role} ({preset.experienceLevel.split(" ")[0]})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-zinc-800/60">
              <button
                type="submit"
                disabled={generating || !role.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-xs font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
              >
                <span>Generate Preparation Plan</span>
                <span>→</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Saved Preparation Plans Selector */}
      {plans.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-zinc-500 mr-1">Your Plans:</span>
          {plans.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePlan(p);
                if (p.questions?.length > 0) setActiveQuestion(p.questions[0]);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer border ${
                activePlan?.id === p.id
                  ? "border-emerald-700 bg-emerald-950/60 text-emerald-200"
                  : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {p.role} ({p.experienceLevel?.split(" ")[0] || "Senior"})
            </button>
          ))}
        </div>
      )}

      {/* Active Plan Overview & Skill Matrix */}
      {activePlan && (
        <section className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-emerald-400 border border-emerald-900/60 bg-emerald-950/40 px-2 py-0.5 rounded">
                  {activePlan.experienceLevel}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-xs font-mono text-zinc-400">{activePlan.company}</span>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {activePlan.questions?.length || 0} Graded Questions
              </span>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-100">
                {activePlan.role} Preparation Syllabus
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                {activePlan.overview}
              </p>
            </div>

            {/* Skill Matrix */}
            {activePlan.skillMatrix && activePlan.skillMatrix.length > 0 && (
              <div className="pt-3 border-t border-zinc-800/80 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                  Target Competency Matrix
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {activePlan.skillMatrix.map((matrix, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-200">{matrix.area}</span>
                        <span className="text-[10px] font-mono text-emerald-400">{matrix.importance}</span>
                      </div>
                      <ul className="text-[11px] text-zinc-400 space-y-0.5">
                        {matrix.competencies?.map((comp, cIdx) => (
                          <li key={cIdx} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-zinc-600" />
                            <span>{comp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Graded Question Bank & Interactive Practice Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Graded Question Bank */}
            <aside className="lg:col-span-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-4 lg:sticky lg:top-20">
              <div className="space-y-3 border-b border-zinc-800 pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                    Question Bank
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {filteredQuestions.length} in view
                  </span>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-zinc-300 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Levels</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>

                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-zinc-300 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Domains</option>
                    {uniqueCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {filteredQuestions.map((q, idx) => {
                  const active = q.id === activeQuestion?.id;
                  const hasAnswered = pastSessions.some((s) => s.questionId === q.id);

                  let diffColor = "text-emerald-400 border-emerald-900/60 bg-emerald-950/30";
                  if (q.difficulty === "Medium") diffColor = "text-amber-400 border-amber-900/60 bg-amber-950/30";
                  if (q.difficulty === "Hard") diffColor = "text-rose-400 border-rose-900/60 bg-rose-950/30";

                  return (
                    <button
                      key={q.id}
                      onClick={() => handleSelectQuestion(q)}
                      className={`w-full text-left rounded-lg p-3 text-xs transition border flex flex-col gap-1.5 cursor-pointer ${
                        active
                          ? "border-emerald-600 bg-emerald-950/40 text-zinc-100"
                          : "border-zinc-800/80 bg-zinc-900/30 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${diffColor}`}>
                          {q.difficulty}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                          {hasAnswered && <span className="text-emerald-400">✓ Evaluated</span>}
                          <span>{q.category}</span>
                        </div>
                      </div>
                      <p className="line-clamp-2 leading-relaxed font-medium text-zinc-200">
                        {q.question}
                      </p>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Right: Active Practice & AI Evaluation Panel */}
            <main className="lg:col-span-8 space-y-6">
              {activeQuestion ? (
                <div className="space-y-6">
                  {/* Question Scenario Card */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-mono text-zinc-500 uppercase">{activeQuestion.category}</span>
                      <span className="font-mono text-emerald-400 border border-emerald-900/60 bg-emerald-950/40 px-2 py-0.5 rounded">
                        Difficulty: {activeQuestion.difficulty}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-semibold text-zinc-100">
                      {activeQuestion.question}
                    </h3>

                    {activeQuestion.scenario && (
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 text-xs text-zinc-300 leading-relaxed">
                        <span className="font-semibold text-zinc-400 uppercase font-mono text-[10px] block mb-1">
                          Scenario Context:
                        </span>
                        {activeQuestion.scenario}
                      </div>
                    )}

                    {activeQuestion.keyPointsToCover && activeQuestion.keyPointsToCover.length > 0 && (
                      <div className="space-y-1.5 text-xs text-zinc-400">
                        <span className="font-medium text-zinc-300 text-[11px] uppercase tracking-wider font-mono">
                          Key Dimensions to Address:
                        </span>
                        <ul className="list-disc pl-5 space-y-0.5 text-zinc-400">
                          {activeQuestion.keyPointsToCover.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Practice Workspace: User Technical Answer */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                        Your Technical Answer
                      </h4>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>

                    <textarea
                      rows={8}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Detail your architectural approach, tradeoffs, failure mitigation, and telemetry considerations here..."
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs sm:text-sm text-zinc-200 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none font-mono leading-relaxed resize-y"
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <button
                        onClick={() => setShowModelAnswer(!showModelAnswer)}
                        className="text-xs text-zinc-400 hover:text-zinc-200 font-mono underline cursor-pointer"
                      >
                        {showModelAnswer ? "Hide Model Answer" : "Reveal Staff-Level Model Answer"}
                      </button>

                      <button
                        onClick={handleEvaluateAnswer}
                        disabled={evaluating || !userAnswer.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-xs font-medium text-white hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-950/40"
                      >
                        <span>{evaluating ? "Evaluating Tradeoffs..." : "Submit Answer for AI Evaluation"}</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>

                  {/* AI Answer Evaluation Critique */}
                  {evaluation && (
                    <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/20 p-6 space-y-4 animate-in fade-in">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/50 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-300 font-mono">
                            AI Evaluation &amp; Hiring Bar Critique
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-emerald-400 font-mono">
                            {evaluation.score}/100
                          </span>
                          <span className="text-xs font-mono text-emerald-300 border border-emerald-800 bg-emerald-900/40 px-2 py-0.5 rounded">
                            {evaluation.rating}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                        {evaluation.summary}
                      </p>

                      <div className="grid gap-4 sm:grid-cols-2 pt-2">
                        {/* Strengths */}
                        <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/40 p-4 space-y-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 font-mono">
                            ✓ Key Strengths
                          </span>
                          <ul className="text-xs text-emerald-200/90 space-y-1 list-disc pl-4">
                            {evaluation.strengths?.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Gaps */}
                        <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 p-4 space-y-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 font-mono">
                            ⚠ Overlooked Nuances / Gaps
                          </span>
                          <ul className="text-xs text-amber-200/90 space-y-1 list-disc pl-4">
                            {evaluation.gaps?.map((g, idx) => (
                              <li key={idx}>{g}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Follow-Up Probe */}
                      {evaluation.followUp && (
                        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 space-y-1 text-xs">
                          <span className="font-semibold text-emerald-400 font-mono uppercase text-[10px] block">
                            Interviewer Follow-Up Probe:
                          </span>
                          <p className="text-zinc-300 italic">
                            &quot;{evaluation.followUp}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Model Answer (Collapsible) */}
                  {showModelAnswer && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-mono">
                          Staff-Level Model Solution
                        </h4>
                        <span className="text-[11px] font-mono text-zinc-500">Benchmark</span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                        {activeQuestion.modelAnswer}
                      </p>
                      {activeQuestion.followUpPrompt && (
                        <div className="pt-2 text-xs text-zinc-400 font-mono">
                          Follow-up to consider: {activeQuestion.followUpPrompt}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Supplementary Almanac Knowledge Notes */}
                  {activeQuestion.relatedNotes && activeQuestion.relatedNotes.length > 0 && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono uppercase text-emerald-400">
                          Supplementary Reading
                        </span>
                        <h4 className="text-xs font-semibold text-zinc-200">
                          Related Almanac Knowledge Notes
                        </h4>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {activeQuestion.relatedNotes.map((n, i) => (
                          <Link
                            key={i}
                            href={`/notes/${n.slug}`}
                            target="_blank"
                            className="group flex items-center justify-between p-3 rounded-md border border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 transition"
                          >
                            <span className="text-xs text-zinc-300 group-hover:text-emerald-300 truncate pr-2">
                              {n.title}
                            </span>
                            <span className="text-zinc-600 group-hover:text-emerald-400 text-xs">
                              ↗
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-zinc-500">
                  Select a question from the question bank to start practicing.
                </div>
              )}
            </main>
          </div>
        </section>
      )}
    </div>
  );
}
