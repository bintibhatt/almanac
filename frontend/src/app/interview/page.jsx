"use client";

import { useState } from "react";
import Link from "next/link";
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Header */}
      <div className="border-b border-[var(--border)] pb-8">
        <span className="inline-block rounded-full bg-[var(--surface-muted)] px-3.5 py-1 text-xs font-semibold text-[var(--accent)]">
          AI Interview Drill Simulator
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
          System Design & Tech Interview Prep
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-[var(--muted)]">
          Practice production-grade interview questions crafted for Staff & Senior Engineering roles. Test your architectural reasoning, write mock answers, and evaluate AI-generated model answers and follow-ups.
        </p>
      </div>

      {/* Main Grid: Topic Selector + Practice Simulator */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[340px_1fr]">
        {/* Left Column: Topic Selector */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Select Drill Topic
          </h2>

          <div className="space-y-3">
            {INTERVIEW_TOPICS.map((topic) => {
              const isSelected = selectedTopic.slug === topic.slug;
              return (
                <button
                  key={topic.slug}
                  onClick={() => handleStartSession(topic)}
                  className={`w-full text-left rounded-2xl border p-4 transition ${
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--surface-hover)] shadow-sm"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <CategoryBadge>{topic.category}</CategoryBadge>
                    <span className="text-xs font-medium text-[var(--muted)]">{topic.difficulty}</span>
                  </div>
                  <h3 className="mt-3 font-semibold text-[var(--foreground)]">{topic.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">{topic.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Practice Arena */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                Active Interview Scenario
              </span>
              <h2 className="mt-1 text-2xl font-bold">{selectedTopic.title}</h2>
            </div>

            <button
              onClick={() => handleStartSession(selectedTopic)}
              disabled={loading}
              className="inline-flex min-h-11 items-center rounded-full bg-[var(--foreground)] px-5 text-sm font-semibold text-[var(--background)] transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Generating Drills..." : "🔄 Generate New Questions"}
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="py-16 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
              <p className="mt-4 text-sm font-medium text-[var(--muted)]">
                AI is compiling interview drills for {selectedTopic.title}...
              </p>
            </div>
          ) : null}

          {/* Error State */}
          {error ? (
            <div className="my-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
              ⚠️ {error}. Displaying fallback questions below.
            </div>
          ) : null}

          {/* Initial / Active Questions List */}
          {!loading && questions.length > 0 ? (
            <div className="mt-8 space-y-8">
              {questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-5 sm:p-6"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                      Question {idx + 1} • {q.level || "Senior"} Level
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-semibold text-[var(--foreground)]">
                    {q.question}
                  </h3>

                  {/* Candidate Answer Box */}
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                      Your Answer Strategy:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Outline your architectural approach, tradeoffs, and key components..."
                      value={userAnswers[q.id || idx] || ""}
                      onChange={(e) =>
                        setUserAnswers((prev) => ({ ...prev, [q.id || idx]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                    />
                  </div>

                  {/* Model Answer Toggle */}
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={() => toggleReveal(q.id || idx)}
                      className="text-xs font-semibold text-[var(--accent)] hover:underline"
                    >
                      {revealedAnswers[q.id || idx] ? "Hide Model Answer ▲" : "Reveal Model Answer & Follow-up ▼"}
                    </button>
                  </div>

                  {/* Model Answer Body */}
                  {revealedAnswers[q.id || idx] ? (
                    <div className="mt-4 space-y-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 text-sm">
                      <div>
                        <h4 className="font-semibold text-[var(--foreground)]">💡 Model Architectural Answer:</h4>
                        <p className="mt-1 text-[var(--muted)] leading-relaxed">{q.model_answer}</p>
                      </div>

                      {q.follow_up_prompt ? (
                        <div className="border-t border-[var(--border)] pt-3">
                          <h4 className="font-semibold text-[var(--foreground)]">🔥 Follow-Up Interviewer Probe:</h4>
                          <p className="mt-1 text-[var(--accent)] font-medium">{q.follow_up_prompt}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : !loading ? (
            /* Prompt to generate questions */
            <div className="py-12 text-center">
              <p className="text-base font-medium text-[var(--foreground)]">
                Ready to practice {selectedTopic.title}?
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Click "Generate New Questions" to load AI system design questions and model answers.
              </p>
              <button
                onClick={() => handleStartSession(selectedTopic)}
                className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[var(--foreground)] px-6 text-sm font-semibold text-[var(--background)] transition hover:opacity-90"
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
