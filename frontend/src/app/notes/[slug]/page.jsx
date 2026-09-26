import nextDynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryBadge from "@/components/CategoryBadge";
import InteractiveActions from "@/components/InteractiveActions";
import ReadingProgress from "@/components/ReadingProgress";
import TableOfContents from "@/components/TableOfContents";
import { getAdjacentNotes, getAllNotes, getNoteBySlug } from "@/lib/notes";
import { formatDate } from "@/utils/format";

const MarkdownRenderer = nextDynamic(() => import("@/components/MarkdownRenderer"), {
  loading: () => (
    <div className="space-y-3">
      <div className="h-4 w-2/3 rounded bg-[var(--surface-muted)]" />
      <div className="h-4 w-full rounded bg-[var(--surface-muted)]" />
      <div className="h-4 w-5/6 rounded bg-[var(--surface-muted)]" />
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
      title: "Note not found",
    };
  }

  return {
    title: note.title,
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

  return (
    <>
      <ReadingProgress />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 sm:py-9 lg:px-8 xl:grid-cols-[minmax(0,1fr)_260px]">
        <article className="mx-auto w-full max-w-[730px]">
          <Link
            href="/notes"
            className="inline-flex min-h-9 items-center rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-3.5 text-xs font-medium text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
          >
            ← Back to notes
          </Link>

          <header className="mt-7 border-b border-[var(--border)] pb-7 sm:mt-9 sm:pb-9">
            <CategoryBadge>{note.categoryLabel}</CategoryBadge>
            <h1 className="mt-4 text-3xl font-extrabold leading-[1.15] tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl">
              {note.title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--muted)] sm:text-lg">
              {note.description}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-[var(--muted)]">
              <time dateTime={note.published}>{formatDate(note.published)}</time>
              <span aria-hidden="true" className="opacity-40">•</span>
              <span>{note.readingTime}</span>
              <span aria-hidden="true" className="opacity-40">•</span>
              <span className="capitalize">{note.difficulty} Level</span>
            </div>

            {note.tags.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-mono text-sky-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Interactive Learning Suite */}
            <InteractiveActions note={note} />
          </header>

          <div className="markdown-body mt-7 sm:mt-9">
            <MarkdownRenderer content={note.content} />
          </div>

          <nav
            className="mt-12 grid gap-4 border-t border-slate-800/80 pt-8 sm:grid-cols-2"
            aria-label="Previous and next notes"
          >
            {previous ? (
              <Link
                href={`/notes/${previous.slug}`}
                className="group rounded-md border border-slate-800 bg-slate-900/50 p-4 transition-all duration-150 hover:bg-slate-900/80 hover:border-sky-500/30"
              >
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">
                  ← Previous Article
                </span>
                <p className="mt-1 text-xs font-semibold text-white group-hover:text-sky-400 transition-colors">{previous.title}</p>
              </Link>
            ) : (
              <div />
            )}

            {next ? (
              <Link
                href={`/notes/${next.slug}`}
                className="group rounded-md border border-slate-800 bg-slate-900/50 p-4 text-left transition-all duration-150 hover:bg-slate-900/80 hover:border-sky-500/30 sm:text-right"
              >
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-medium">
                  Next Article →
                </span>
                <p className="mt-1 text-xs font-semibold text-white group-hover:text-sky-400 transition-colors">{next.title}</p>
              </Link>
            ) : null}
          </nav>
        </article>

        <TableOfContents headings={note.headings} />
      </div>
    </>
  );
}

