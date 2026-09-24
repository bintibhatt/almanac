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
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-12 backdrop-blur-2xl">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-bold text-violet-400">
            <span>⚡ AI Technical Interview Simulator</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-[var(--foreground)]">
            System Design & <br />
            <span className="gradient-text">Tech Interview Prep</span>
          </h1>
          <p className="text-base text-[var(--muted)] sm:text-lg leading-relaxed">
            Practice production-grade interview questions crafted for Staff & Senior Engineering roles. Test your architectural reasoning, write mock answers, and evaluate AI-generated model answers and follow-ups.
          </p>
        </div>
      </div>

      {/* Main Grid: Topic Selector + Practice Simulator */}
      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        {/* Left Column: Topic Selector */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Select Drill Topic
          </h2>

          <div className="space-y-3">
            {INTERVIEW_TOPICS.map((topic) => {
              const isSelected = selectedTopic.slug === topic.slug;
              return (
                <button
                  key={topic.slug}
                  onClick={() => handleStartSession(topic)}
                  className={`w-full text-left rounded-2xl border p-5 backdrop-blur-xl transition-all duration-200 ${
                    isSelected
                      ? "border-violet-500/60 bg-violet-500/10 shadow-lg shadow-violet-500/10"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <CategoryBadge>{topic.category}</CategoryBadge>
                    <span className="text-xs font-semibold text-violet-400">{topic.difficulty}</span>
                  </div>
                  <h3 className="mt-3 font-bold text-[var(--foreground)] leading-snug">{topic.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-xs text-[var(--muted)]">{topic.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Practice Arena */}
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 backdrop-blur-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                Active Interview Scenario
              </span>
              <h2 className="mt-1 text-2xl font-extrabold text-[var(--foreground)]">{selectedTopic.title}</h2>
            </div>

            <button
              onClick={() => handleStartSession(selectedTopic)}
              disabled={loading}
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 px-6 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:opacity-95 disabled:opacity-40"
            >
              {loading ? "Generating Drills..." : "🔄 Generate New Questions"}
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-20 text-center space-y-4">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
              <p className="text-sm font-semibold text-[var(--muted)]">
                AI is compiling Senior & Staff interview questions for {selectedTopic.title}...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="my-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300">
              ⚠️ {error}. Displaying fallback questions below.
            </div>
          )}

          {/* Active Questions List */}
          {!loading && questions.length > 0 ? (
            <div className="mt-8 space-y-8">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-6 backdrop-blur-md space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                      Question {idx + 1} of {questions.length} • {q.level || "Senior"} Level
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[var(--foreground)] leading-snug">
                    {q.question}
                  </h3>

                  {/* Candidate Answer Box */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[var(--muted)]">
                      Your Architectural Solution Outline:
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Outline your system design approach, scalability tradeoffs, caching, and database decisions..."
                      value={userAnswers[q.id || idx] || ""}
                      onChange={(e) =>
                        setUserAnswers((prev) => ({ ...prev, [q.id || idx]: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] p-4 text-sm text-[var(--foreground)] outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10"
                    />
                  </div>

                  {/* Model Answer Toggle */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => toggleReveal(q.id || idx)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-bold text-violet-400 transition hover:bg-[var(--surface-hover)]"
                    >
                      <span>{revealedAnswers[q.id || idx] ? "Hide Model Architecture" : "Reveal Model Solution & Probes"}</span>
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
                    <div className="mt-4 space-y-4 rounded-xl border border-violet-500/30 bg-violet-500/5 p-5 text-xs leading-relaxed">
                      <div>
                        <h4 className="font-bold text-emerald-400 text-sm">💡 Model Architectural Solution:</h4>
                        <p className="mt-1.5 text-[var(--muted-light)] leading-relaxed">{q.model_answer}</p>
                      </div>

                      {q.follow_up_prompt && (
                        <div className="border-t border-[var(--border)] pt-3">
                          <h4 className="font-bold text-sky-400 text-sm">🔥 Follow-Up Interviewer Probe:</h4>
                          <p className="mt-1 font-semibold text-[var(--foreground)]">{q.follow_up_prompt}</p>
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
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-violet-500/30 bg-violet-500/10 text-3xl">
                🧠
              </div>
              <h3 className="text-xl font-bold text-[var(--foreground)]">
                Ready to practice {selectedTopic.title}?
              </h3>
              <p className="max-w-md mx-auto text-sm text-[var(--muted)] leading-relaxed">
                Click below to generate adaptive system design questions, architecture scenarios, and model answers.
              </p>
              <button
                onClick={() => handleStartSession(selectedTopic)}
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 text-sm font-bold text-white shadow-xl shadow-violet-500/20 transition hover:opacity-95"
              >
                🚀 Start Interview Drill
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

