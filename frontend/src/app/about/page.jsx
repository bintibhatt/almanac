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
  title: "About",
  description: "About Almanac, a focused engineering reading library.",
};

export default function AboutPage() {
  const notes = getAllNotes();
  const categories = getCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-12 lg:px-8">
      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.25fr_0.75fr] lg:p-10">
          <div>
            <CategoryBadge>About Almanac</CategoryBadge>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              A focused reading library for engineering knowledge.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              Almanac is built for notes that are worth returning to: system
              design ideas, implementation patterns, technical papers,
              infrastructure concepts, and practical engineering references.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/notes"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--foreground)] px-5 text-sm font-medium text-[var(--background)] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
              >
                Browse notes
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
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
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"
              >
                <div className="text-2xl font-semibold tracking-tight">{value}</div>
                <p className="mt-1 text-sm text-[var(--muted)]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 border-b border-[var(--border)] py-10 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            Purpose
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Why It Exists</h2>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="space-y-5 text-base leading-8 text-[var(--muted)]">
            <p>
              Engineering knowledge gets noisy fast. Almanac keeps the interface
              quiet so the note can do the work. It favors durable explanations,
              clear examples, and easy revisiting over feeds, reactions, or
              publication ceremony.
            </p>
            <p>
              The app reads directly from the local knowledge directory, which
              keeps writing simple and ownership clear. Markdown remains the
              source of truth, while the frontend provides search-ready
              structure, typography, navigation, and offline-friendly reading.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)] py-10">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            Principles
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">Designed Like a Reader</h2>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {principles.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                {item.eyebrow}
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-8 border-b border-[var(--border)] py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
            Architecture
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Markdown In, Reading App Out</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            The frontend stays fast by using server-rendered data from the local
            filesystem and only adding client JavaScript where interaction is
            useful: theme switching, reading progress, and copying code.
          </p>
        </div>

        <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          {architecture.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 p-4">
              <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
              <span className="text-right text-sm text-[var(--muted)]">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
              Library
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Browse by Category</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Start with a category or continue into the full notes view.
            </p>
          </div>
          <Link
            href="/notes"
            className="inline-flex min-h-11 w-fit items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
          >
            View all notes
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/notes?category=${category.slug}`}
              className="flex min-h-16 items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
            >
              <span className="font-medium text-[var(--foreground)]">{category.label}</span>
              <span className="rounded-full bg-[var(--accent-muted)] px-2.5 py-1 text-xs font-medium text-[var(--accent)]">
                {category.count}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
