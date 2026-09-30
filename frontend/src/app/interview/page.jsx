"use client";

import { useState } from "react";
import CategoryBadge from "@/components/CategoryBadge";

const INTERVIEW_TOPICS = [
  {
    slug: "rag-architecture",
    title: "RAG & Vector Search Architecture",
    category: "ai",
    categoryLabel: "AI / Search",
    difficulty: "Senior / Staff",
    description: "System design questions covering hybrid BM25 + dense retrieval, embedding latency, chunking strategies, and reranking pipelines.",
    sampleQuestion: "How do you optimize vector search latency when scaling to 100M+ high-dimensional embeddings?",
  },
  {
    slug: "docker-container-memory-isolation",
    title: "Docker Container Memory Isolation & cgroups",
    category: "backend",
    categoryLabel: "Backend / Infra",
    difficulty: "Intermediate / Senior",
    description: "Deep technical questions on Linux cgroups v2 memory limits, OOM killer triggers, swap allocation, and container runtime metrics.",
    sampleQuestion: "What happens inside the Linux kernel when a container exceeds memory.max without swap configured?",
  },
  {
    slug: "load-balancers-design-patterns",
    title: "Load Balancers & Traffic Management",
    category: "system-design",
    categoryLabel: "System Design",
    difficulty: "Senior",
    description: "Architecture questions on Layer 4 vs Layer 7 load balancing, round-robin vs least connections, health checks, and connection draining.",
    sampleQuestion: "Design a high-availability global load balancing layer with zero-downtime rolling deploys.",
  },
  {
    slug: "caching-advanced-concepts",
    title: "Distributed Caching & Invalidation Strategies",
    category: "backend",
    categoryLabel: "Backend",
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

      try {
        const history = JSON.parse(localStorage.getItem("almanac_interview_history") || "[]");
        if (!history.includes(topic.slug)) {
          history.push(topic.slug);
          localStorage.setItem("almanac_interview_history", JSON.stringify(history));
        }
      } catch {
        // Failsafe
      }
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-2 border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-semibold text-zinc-100 tracking-tight">
          System Design &amp; Technical Interview Prep
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
          Practice production-grade interview questions designed for Staff &amp; Senior Engineering roles. Write out architectural trade-offs and evaluate AI model answers.
        </p>
      </div>

      {/* Main Grid: Topic Selector + Simulator */}
      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        {/* Left Column: Topic Selector */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            <span>Select Practice Topic</span>
          </h2>

          <div className="space-y-2.5">
            {INTERVIEW_TOPICS.map((topic) => {
              const isSelected = selectedTopic.slug === topic.slug;
              return (
                <button
                  key={topic.slug}
                  onClick={() => handleStartSession(topic)}
                  className={`w-full text-left rounded-lg border p-4 transition ${
                    isSelected
                      ? "border-violet-600/80 bg-violet-950/40 text-zinc-100"
                      : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <CategoryBadge category={topic.category} label={topic.categoryLabel} />
                    <span className="text-[11px] font-mono text-zinc-500">{topic.difficulty}</span>
                  </div>
                  <h3 className="text-xs font-medium text-zinc-100 leading-snug">{topic.title}</h3>
                  <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400 leading-relaxed">{topic.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Practice Arena */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Active Scenario
              </span>
              <h2 className="mt-1 text-lg font-medium text-zinc-100">{selectedTopic.title}</h2>
            </div>

            <button
              onClick={() => handleStartSession(selectedTopic)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-40 transition"
            >
              {loading ? "Generating Drills..." : "Generate New Questions"}
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="py-20 text-center space-y-2">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-violet-500/40 border-t-violet-400" />
              <p className="text-xs font-mono text-zinc-500">
                Compiling Senior &amp; Staff interview questions...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="my-5 rounded-md border border-rose-800/60 bg-rose-950/40 p-3 text-xs text-rose-300">
              {error}. Displaying questions below.
            </div>
          )}

          {/* Active Questions */}
          {!loading && questions.length > 0 ? (
            <div className="mt-6 space-y-6">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-5 space-y-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-zinc-500">
                      Question {idx + 1} of {questions.length} • <span className="text-violet-400">{q.level || "Senior"} Level</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-medium text-zinc-100 leading-snug">
                    {q.question}
                  </h3>

                  {/* Candidate Answer Box */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-zinc-400">
                      Your Architectural Solution Outline:
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Outline system design approach, scalability trade-offs, caching layer, and data consistency decisions..."
                      value={userAnswers[q.id || idx] || ""}
                      onChange={(e) =>
                        setUserAnswers((prev) => ({ ...prev, [q.id || idx]: e.target.value }))
                      }
                      className="w-full rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-200 outline-none focus:border-violet-500 transition"
                    />
                  </div>

                  {/* Model Answer Toggle */}
                  <div>
                    <button
                      onClick={() => toggleReveal(q.id || idx)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition"
                    >
                      <span>{revealedAnswers[q.id || idx] ? "Hide Model Solution" : "Reveal Model Solution"}</span>
                      <svg
                        className={`h-3 w-3 text-zinc-400 transition-transform ${revealedAnswers[q.id || idx] ? "rotate-180" : ""}`}
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
                    <div className="mt-3 space-y-2.5 rounded-md border border-violet-900/40 bg-zinc-900/80 p-3.5 text-xs leading-relaxed">
                      <div>
                        <h4 className="font-medium text-violet-300">Model Architectural Solution:</h4>
                        <p className="mt-1 text-zinc-300">{q.model_answer}</p>
                      </div>

                      {q.follow_up_prompt && (
                        <div className="border-t border-zinc-800 pt-2.5">
                          <h4 className="font-medium text-violet-400">Interviewer Follow-Up Probe:</h4>
                          <p className="mt-1 text-zinc-400">{q.follow_up_prompt}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : !loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-violet-800/40 bg-violet-950/40 text-violet-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-zinc-200">
                Ready to practice {selectedTopic.title}?
              </h3>
              <p className="max-w-md mx-auto text-xs text-zinc-500 leading-relaxed">
                Generate adaptive system design questions, architecture trade-offs, and follow-up probes.
              </p>
              <button
                onClick={() => handleStartSession(selectedTopic)}
                className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition"
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
