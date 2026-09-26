"use client";

import { useState } from "react";
import CategoryBadge from "@/components/CategoryBadge";

const INTERVIEW_TOPICS = [
  {
    slug: "rag-architecture",
    title: "RAG & Vector Search Architecture",
    category: "AI / Search",
    difficulty: "Senior / Staff",
    description: "System design questions covering hybrid BM25 + dense retrieval, embedding latency, chunking strategies, and reranking pipelines.",
    sampleQuestion: "How do you optimize vector search latency when scaling to 100M+ high-dimensional embeddings?",
  },
  {
    slug: "docker-container-memory-isolation",
    title: "Docker Container Memory Isolation & cgroups",
    category: "Backend / Infra",
    difficulty: "Intermediate / Senior",
    description: "Deep technical questions on Linux cgroups v2 memory limits, OOM killer triggers, swap allocation, and container runtime metrics.",
    sampleQuestion: "What happens inside the Linux kernel when a container exceeds `memory.max` without swap configured?",
  },
  {
    slug: "load-balancers-design-patterns",
    title: "Load Balancers & Traffic Management",
    category: "System Design",
    difficulty: "Senior",
    description: "Architecture questions on Layer 4 vs Layer 7 load balancing, round-robin vs least connections, health checks, and connection draining.",
    sampleQuestion: "Design a high-availability global load balancing layer with zero-downtime rolling deploys.",
  },
  {
    slug: "caching-advanced-concepts",
    title: "Distributed Caching & Invalidation Strategies",
    category: "Backend",
    difficulty: "Intermediate",
    description: "Interview drills on cache stampede prevention, write-through vs write-back, Redis eviction policies, and cache consistency.",
    sampleQuestion: "How do you solve cache stampede (thundering herd problem) under 100k requests/second peak traffic?",
  },
];

export default function InterviewPage() {
  const [selectedTopic, setSelectedTopic] = useState(INTERVIEW_TOPICS[0]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [revealedAnswers, setRevealedAnswers] = useState({});

  const handleStartSession = async (topic) => {
    setSelectedTopic(topic);
    setLoading(true);
    setError(null);
    setQuestions([]);
    setUserAnswers({});
    setRevealedAnswers({});

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: topic.slug, title: topic.title }),
      });

      if (!res.ok) throw new Error("Failed to generate interview questions");

      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleReveal = (qId) => {
    setRevealedAnswers((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 space-y-12">
      {/* Unboxed Minimal Header */}
      <div className="space-y-2 border-b border-white/10 pb-8">
        <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
          Interview Simulator
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
          System Design & <br />
          <span className="gradient-text font-normal">Tech Interview Prep</span>
        </h1>
        <p className="text-xs sm:text-base text-zinc-400 leading-relaxed max-w-2xl">
          Practice production-grade interview questions crafted for Staff & Senior Engineering roles. Test your architectural reasoning, write mock answers, and evaluate AI-generated model answers.
        </p>
      </div>

      {/* Main Grid: Topic Selector + Practice Simulator */}
      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        {/* Left Column: Topic Selector */}
        <div className="space-y-3">
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            Select Drill Topic
          </h2>

          <div className="space-y-3">
            {INTERVIEW_TOPICS.map((topic) => {
              const isSelected = selectedTopic.slug === topic.slug;
              return (
                <button
                  key={topic.slug}
                  onClick={() => handleStartSession(topic)}
                  className={`w-full text-left rounded-xl border p-4.5 transition-all duration-200 ${
                    isSelected
                      ? "border-white/30 bg-white/10 text-white"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <CategoryBadge>{topic.category}</CategoryBadge>
                    <span className="text-[11px] font-mono text-zinc-400 font-medium">{topic.difficulty}</span>
                  </div>
                  <h3 className="mt-2.5 text-xs font-bold text-white leading-snug">{topic.title}</h3>
                  <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">{topic.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Practice Arena */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
                Active Scenario
              </span>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold text-white">{selectedTopic.title}</h2>
            </div>

            <button
              onClick={() => handleStartSession(selectedTopic)}
              disabled={loading}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-40"
            >
              {loading ? "Generating Drills..." : "Generate New Questions"}
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-20 text-center space-y-3">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <p className="text-xs font-medium text-zinc-400">
                Compiling Senior & Staff interview questions...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="my-6 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-medium text-rose-300">
              {error}. Displaying fallback questions below.
            </div>
          )}

          {/* Active Questions List */}
          {!loading && questions.length > 0 ? (
            <div className="mt-6 space-y-6">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-zinc-400">
                      Question {idx + 1} of {questions.length} • <span className="text-white font-medium">{q.level || "Senior"} Level</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">
                    {q.question}
                  </h3>

                  {/* Candidate Answer Box */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-400">
                      Your Architectural Solution Outline:
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Outline your system design approach, scalability tradeoffs, caching, and database decisions..."
                      value={userAnswers[q.id || idx] || ""}
                      onChange={(e) =>
                        setUserAnswers((prev) => ({ ...prev, [q.id || idx]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-white/10 bg-black/40 p-3.5 text-xs text-zinc-200 outline-none transition focus:border-white/30 focus:ring-1 focus:ring-white/20"
                    />
                  </div>

                  {/* Model Answer Toggle */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => toggleReveal(q.id || idx)}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10"
                    >
                      <span>{revealedAnswers[q.id || idx] ? "Hide Model Solution" : "Reveal Model Solution"}</span>
                      <svg
                        className={`h-3.5 w-3.5 transition-transform ${revealedAnswers[q.id || idx] ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Model Answer Body */}
                  {revealedAnswers[q.id || idx] && (
                    <div className="mt-4 space-y-3 rounded-lg border border-white/10 bg-white/5 p-4 text-xs leading-relaxed">
                      <div>
                        <h4 className="font-bold text-white">Model Architectural Solution:</h4>
                        <p className="mt-1.5 text-zinc-300 leading-relaxed">{q.model_answer}</p>
                      </div>

                      {q.follow_up_prompt && (
                        <div className="border-t border-white/10 pt-3">
                          <h4 className="font-bold text-white">Interviewer Follow-Up Probe:</h4>
                          <p className="mt-1 text-zinc-300">{q.follow_up_prompt}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : !loading ? (
            /* Prompt to generate questions */
            <div className="py-16 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xl">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white">
                Ready to practice {selectedTopic.title}?
              </h3>
              <p className="max-w-md mx-auto text-xs text-zinc-400 leading-relaxed">
                Click below to generate adaptive system design questions, architecture scenarios, and model answers.
              </p>
              <button
                onClick={() => handleStartSession(selectedTopic)}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-6 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
              >
                Start Interview Drill
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}



