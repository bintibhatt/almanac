import nextDynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryBadge from "@/components/CategoryBadge";
import InteractiveActions from "@/components/InteractiveActions";
import ReadingProgress from "@/components/ReadingProgress";
import TableOfContents from "@/components/TableOfContents";
import { formatTag, getAdjacentNotes, getAllNotes, getNoteBySlug, getRelatedNotes } from "@/lib/notes";
import { formatDate } from "@/utils/format";

const MarkdownRenderer = nextDynamic(() => import("@/components/MarkdownRenderer"), {
  loading: () => (
    <div className="space-y-3 py-6">
      <div className="h-4 w-2/3 rounded bg-zinc-800 animate-pulse" />
      <div className="h-4 w-full rounded bg-zinc-800 animate-pulse" />
      <div className="h-4 w-5/6 rounded bg-zinc-800 animate-pulse" />
    </div>
  ),
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return getAllNotes().map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const note = getNoteBySlug(slug);

  if (!note) {
    return {
      title: "Note not found | Almanac",
    };
  }

  return {
    title: `${note.title} | Almanac`,
    description: note.description,
  };
}

export default async function NotePage({ params }) {
  const { slug } = await params;
  const note = getNoteBySlug(slug);

  if (!note) {
    notFound();
  }

  const { previous, next } = getAdjacentNotes(note.slug);
  const relatedNotes = getRelatedNotes(note, 3);

  return (
    <>
      <ReadingProgress />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_240px]">
        <article className="min-w-0 max-w-3xl">
          {/* Breadcrumb / Back button */}
          <Link
            href="/notes"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mb-6"
          >
            <span>←</span>
            <span>Back to library</span>
          </Link>

          {/* Article Header */}
          <header className="border-b border-zinc-800 pb-7 mb-8">
            <div className="flex items-center gap-3 mb-3">
              <CategoryBadge category={note.category} label={note.categoryLabel} />
              <span className="text-xs text-zinc-500 font-mono">{note.readingTime}</span>
              <span className="text-xs text-zinc-500 capitalize">• {note.difficulty}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-zinc-100 mb-3">
              {note.title}
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-4">
              {note.description}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500 pt-3 border-t border-zinc-800/60">
              <div className="flex items-center gap-3">
                <span>Published: {formatDate(note.published)}</span>
                {note.updated && note.updated !== note.published && (
                  <span>• Updated: {formatDate(note.updated)}</span>
                )}
              </div>

              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800"
                    >
                      #{formatTag(tag)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* AI Learning Suite: Ask, Flashcards, Quiz, Interview */}
            <div className="mt-6">
              <InteractiveActions note={note} />
            </div>
          </header>

          {/* Table of contents for mobile/tablet */}
          <TableOfContents headings={note.headings} />

          {/* Main Article Content */}
          <div className="prose prose-invert prose-zinc max-w-none text-zinc-300">
            <MarkdownRenderer content={note.content} />
          </div>

          {/* Related Notes (Vector Semantic Search) */}
          {relatedNotes && relatedNotes.length > 0 && (
            <div className="mt-14 pt-8 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Related Engineering Guides
                </h2>
                <span className="text-[11px] text-zinc-500 font-mono">
                  Vector Semantic Relevance
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {relatedNotes.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/notes/${rel.slug}`}
                    className="p-3.5 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-lg transition group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-medium text-violet-400 uppercase tracking-wider block mb-1">
                        {rel.categoryLabel}
                      </span>
                      <h3 className="text-xs font-medium text-zinc-200 group-hover:text-violet-300 transition line-clamp-2">
                        {rel.title}
                      </h3>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono mt-3 pt-2 border-t border-zinc-800/60 block">
                      {rel.readingTime}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Previous / Next Article Navigation */}
          <nav
            className="mt-8 grid gap-4 sm:grid-cols-2 pt-6 border-t border-zinc-800"
            aria-label="Previous and next notes"
          >
            {previous ? (
              <Link
                href={`/notes/${previous.slug}`}
                className="group p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 hover:border-zinc-700 transition"
              >
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                  ← Previous Article
                </span>
                <p className="text-xs font-medium text-zinc-200 group-hover:text-violet-300 transition line-clamp-1">
                  {previous.title}
                </p>
              </Link>
            ) : (
              <div />
            )}

            {next ? (
              <Link
                href={`/notes/${next.slug}`}
                className="group p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900 hover:border-zinc-700 transition sm:text-right"
              >
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1">
                  Next Article →
                </span>
                <p className="text-xs font-medium text-zinc-200 group-hover:text-violet-300 transition line-clamp-1">
                  {next.title}
                </p>
              </Link>
            ) : null}
          </nav>
        </article>

        {/* Desktop Sticky Table of Contents */}
        <TableOfContents headings={note.headings} />
      </div>
    </>
  );
}
