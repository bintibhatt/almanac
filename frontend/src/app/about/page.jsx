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
    title: "Local Knowledge",
    description:
      "Markdown files in the knowledge directory are the source of truth. The app adds structure without taking ownership away from the files.",
  },
  {
    eyebrow: "03",
    title: "Progressive",
    description:
      "PWA metadata, large touch targets, cached pages, and an offline fallback make the library feel closer to an installed reader.",
  },
  {
    eyebrow: "04",
    title: "Expandable",
    description:
      "Categories, tags, reading time, table of contents, and adjacent-note navigation are generated from the content layer.",
  },
];

const architecture = [
  ["Source", "../knowledge markdown files"],
  ["Parser", "gray-matter frontmatter"],
  ["Renderer", "react-markdown with GFM"],
  ["Offline", "service worker page cache"],
];

export const metadata = {
  title: "About | Almanac",
  description: "About Almanac, a focused engineering reading library.",
};

export default function AboutPage() {
  const notes = getAllNotes();
  const categories = getCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 space-y-16">
      {/* Unboxed Header */}
      <section className="space-y-6 border-b border-white/10 pb-10">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] pt-2">
          <div className="space-y-4">
            <CategoryBadge>About Almanac</CategoryBadge>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white leading-[1.1]">
              A focused reading library <br />
              <span className="gradient-text font-normal">for engineering knowledge</span>
            </h1>
            <p className="text-xs sm:text-base text-zinc-400 leading-relaxed max-w-xl">
              Almanac is built for notes that are worth returning to: system design ideas, implementation patterns, technical papers, infrastructure concepts, and practical engineering references.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/notes"
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-white px-5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
              >
                Browse notes →
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-5 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                Today&apos;s read
              </Link>
            </div>
          </div>

          <div className="grid gap-3 self-end">
            {[
              [notes.length, pluralize(notes.length, "note")],
              [categories.length, pluralize(categories.length, "category", "categories")],
              ["PWA", "Installable reader shell"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="text-2xl font-bold text-white font-mono">{value}</div>
                <p className="mt-0.5 text-xs font-medium text-zinc-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            Purpose
          </span>
          <h2 className="text-2xl font-extrabold text-white">Why It Exists</h2>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 space-y-4 text-xs sm:text-sm leading-relaxed text-zinc-400">
          <p>
            Engineering knowledge gets noisy fast. Almanac keeps the interface quiet so the note can do the work. It favors durable explanations, clear examples, and easy revisiting over feeds, reactions, or publication ceremony.
          </p>
          <p>
            The app reads directly from the local knowledge directory, which keeps writing simple and ownership clear. Markdown remains the source of truth, while the frontend provides search-ready structure, typography, navigation, and offline-friendly reading.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            Principles
          </span>
          <h2 className="text-2xl font-extrabold text-white">Designed Like a Reader</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {principles.map((item) => (
            <article
              key={item.title}
              className="group rounded-xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-200 hover:bg-white/[0.04] hover:border-white/20"
            >
              <span className="text-[11px] font-mono text-zinc-400 font-bold">
                {item.eyebrow}
              </span>
              <h3 className="mt-2 text-base font-bold text-white transition-colors">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            Architecture
          </span>
          <h2 className="text-2xl font-extrabold text-white">Markdown In, Reading App Out</h2>
          <p className="text-xs leading-relaxed text-zinc-400 max-w-xl">
            The frontend stays fast by using server-rendered data from the local filesystem and only adding client JavaScript where interaction is useful: theme switching, reading progress, and copying code.
          </p>
        </div>

        <div className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
          {architecture.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 p-4 text-xs">
              <span className="font-semibold text-white">{label}</span>
              <span className="font-mono text-zinc-300 font-medium">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6 pt-4 border-t border-white/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Library
            </span>
            <h2 className="mt-1 text-2xl font-extrabold text-white">Browse by Category</h2>
          </div>
          <Link
            href="/notes"
            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            View all notes →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/notes?category=${category.slug}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3.5 text-xs transition-all hover:border-white/20 hover:bg-white/[0.04]"
            >
              <span className="font-bold text-white">{category.label}</span>
              <span className="rounded-md bg-white/5 border border-white/10 px-2.5 py-0.5 font-mono text-[11px] text-zinc-400">
                {category.count}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}



