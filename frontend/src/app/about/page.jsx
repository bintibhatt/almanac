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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-12 backdrop-blur-2xl">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-5">
            <CategoryBadge>About Almanac</CategoryBadge>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-[var(--foreground)] leading-[1.1]">
              A focused reading library <br />
              <span className="gradient-text">for engineering knowledge</span>
            </h1>
            <p className="text-base text-[var(--muted)] leading-relaxed sm:text-lg">
              Almanac is built for notes that are worth returning to: system design ideas, implementation patterns, technical papers, infrastructure concepts, and practical engineering references.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/notes"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:opacity-95"
              >
                Browse notes →
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-6 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-hover)]"
              >
                Today&apos;s read
              </Link>
            </div>
          </div>

          <div className="grid gap-4 self-end">
            {[
              [notes.length, pluralize(notes.length, "note")],
              [categories.length, pluralize(categories.length, "category", "categories")],
              ["PWA", "Installable reader shell"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5 backdrop-blur-md"
              >
                <div className="text-3xl font-black text-sky-400">{value}</div>
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Purpose
          </span>
          <h2 className="text-2xl font-extrabold text-[var(--foreground)]">Why It Exists</h2>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 backdrop-blur-xl space-y-4 text-sm leading-relaxed text-[var(--muted)]">
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
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Principles
          </span>
          <h2 className="text-2xl font-extrabold text-[var(--foreground)]">Designed Like a Reader</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {principles.map((item) => (
            <article
              key={item.title}
              className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-xl"
            >
              <span className="text-xs font-black uppercase tracking-wider text-sky-400">
                {item.eyebrow}
              </span>
              <h3 className="mt-3 text-lg font-bold text-[var(--foreground)]">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Architecture
          </span>
          <h2 className="text-2xl font-extrabold text-[var(--foreground)]">Markdown In, Reading App Out</h2>
          <p className="text-xs leading-relaxed text-[var(--muted)] max-w-xl">
            The frontend stays fast by using server-rendered data from the local filesystem and only adding client JavaScript where interaction is useful: theme switching, reading progress, and copying code.
          </p>
        </div>

        <div className="divide-y divide-[var(--border)] rounded-3xl border border-[var(--border)] bg-[var(--surface)] backdrop-blur-xl overflow-hidden">
          {architecture.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 p-5 text-xs">
              <span className="font-bold text-[var(--foreground)]">{label}</span>
              <span className="font-mono text-[var(--muted)]">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6 pt-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Library
            </span>
            <h2 className="mt-1 text-2xl font-extrabold text-[var(--foreground)]">Browse by Category</h2>
          </div>
          <Link
            href="/notes"
            className="inline-flex items-center gap-1 text-xs font-bold text-sky-400 hover:underline"
          >
            View all notes →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/notes?category=${category.slug}`}
              className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs transition-all hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
            >
              <span className="font-bold text-[var(--foreground)]">{category.label}</span>
              <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 font-semibold text-sky-400">
                {category.count}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

