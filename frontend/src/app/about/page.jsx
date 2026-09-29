import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import { getAllNotes, getCategories } from "@/lib/notes";
import { pluralize } from "@/utils/format";

const principles = [
  {
    eyebrow: "01",
    title: "Reading First",
    description:
      "The interface stays quiet so long-form engineering notes remain comfortable on a phone, tablet, or desktop.",
  },
  {
    eyebrow: "02",
    title: "Local Knowledge & Vector Embeddings",
    description:
      "Markdown files in the knowledge directory are the source of truth, augmented with precomputed dense vector embeddings for semantic retrieval.",
  },
  {
    eyebrow: "03",
    title: "Autonomous Ingestion",
    description:
      "Daily background pipelines crawl technical discussion boards, filter for architectural originality, validate against LLM guidelines, and expand the graph.",
  },
  {
    eyebrow: "04",
    title: "Active Learning Suite",
    description:
      "Every article includes contextual AI Q&A, spaced-repetition flashcards, recall quizzes, and Staff-level system design drills.",
  },
];

const architecture = [
  ["Content Source", "Markdown in /knowledge"],
  ["Vector Index", "fastembed (BAAI/bge-small-en-v1.5)"],
  ["AI Layer", "OpenRouter / Gemini / OpenAI"],
  ["Pipeline", "Autonomous GitHub Actions workflow"],
  ["Frontend Shell", "Next.js 15 App Router & PWA Service Worker"],
];

export const metadata = {
  title: "About Almanac | Engineering Knowledge Base",
  description: "About Almanac, an autonomous AI-powered engineering knowledge and learning platform.",
};

export default function AboutPage() {
  const notes = getAllNotes();
  const categories = getCategories();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-14">
      {/* Header */}
      <section className="space-y-4 border-b border-zinc-800 pb-8">
        <CategoryBadge>Autonomous Engineering Knowledge</CategoryBadge>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-100">
          About Almanac<span className="text-violet-400">.</span>
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl">
          Almanac is built for notes that are worth returning to: distributed systems patterns, Linux kernel memory management, vector search algorithms, and production backend architecture.
        </p>

        <div className="grid grid-cols-3 gap-3 pt-4 max-w-md">
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-center">
            <span className="text-xl font-semibold font-mono text-zinc-100">{notes.length}</span>
            <p className="text-[11px] text-zinc-500 mt-0.5">{pluralize(notes.length, "note")}</p>
          </div>
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-center">
            <span className="text-xl font-semibold font-mono text-zinc-100">{categories.length}</span>
            <p className="text-[11px] text-zinc-500 mt-0.5">Domains</p>
          </div>
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-center">
            <span className="text-xl font-semibold font-mono text-violet-400">PWA</span>
            <p className="text-[11px] text-zinc-500 mt-0.5">Offline Shell</p>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Core Engineering Principles
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {principles.map((item) => (
            <div
              key={item.title}
              className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition"
            >
              <span className="text-xs font-mono font-medium text-violet-400">
                {item.eyebrow}
              </span>
              <h3 className="mt-1.5 text-sm font-medium text-zinc-100">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Technical Stack
        </h2>
        <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg bg-zinc-900/40 overflow-hidden">
          {architecture.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between p-3.5 text-xs">
              <span className="font-medium text-zinc-300">{label}</span>
              <span className="font-mono text-zinc-400">{value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
