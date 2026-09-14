import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryBadge from "@/components/CategoryBadge";
import InteractiveActions from "@/components/InteractiveActions";
import ReadingProgress from "@/components/ReadingProgress";
import TableOfContents from "@/components/TableOfContents";
import { getAdjacentNotes, getAllNotes, getNoteBySlug } from "@/lib/notes";
import { formatDate } from "@/utils/format";

const MarkdownRenderer = dynamic(() => import("@/components/MarkdownRenderer"), {
  loading: () => (
    <div className="space-y-3">
      <div className="h-4 w-2/3 rounded bg-[var(--surface-muted)]" />
      <div className="h-4 w-full rounded bg-[var(--surface-muted)]" />
      <div className="h-4 w-5/6 rounded bg-[var(--surface-muted)]" />
    </div>
  ),
});

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
            className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--muted)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
          >
            Back to notes
          </Link>

          <header className="mt-7 border-b border-[var(--border)] pb-7 sm:mt-9 sm:pb-9">
            <CategoryBadge>{note.categoryLabel}</CategoryBadge>
            <h1 className="mt-5 text-[2.35rem] font-semibold leading-[1.05] tracking-tight text-[var(--foreground)] sm:text-5xl">
              {note.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-[var(--muted)] sm:text-xl sm:leading-9">
              {note.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[var(--muted)]">
              <time dateTime={note.published}>{formatDate(note.published)}</time>
              <span aria-hidden="true">/</span>
              <span>{note.readingTime}</span>
              <span aria-hidden="true">/</span>
              <span>{note.difficulty}</span>
            </div>

            {note.tags.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[var(--surface-muted)] px-3 py-1.5 text-xs text-[var(--muted)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Interactive Learning Suite: AI Quiz, Flashcards, Interview Prep, Ask AI */}
            <InteractiveActions note={note} />
          </header>

          <div className="markdown-body mt-7 sm:mt-9">
            <MarkdownRenderer content={note.content} />
          </div>

          <nav
            className="mt-12 grid gap-3 border-t border-[var(--border)] pt-6 sm:grid-cols-2"
            aria-label="Previous and next notes"
          >
            {previous ? (
              <Link
                href={`/notes/${previous.slug}`}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
              >
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                  Previous
                </span>
                <p className="mt-2 font-medium">{previous.title}</p>
              </Link>
            ) : (
              <div />
            )}

            {next ? (
              <Link
                href={`/notes/${next.slug}`}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] sm:text-right"
              >
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                  Next
                </span>
                <p className="mt-2 font-medium">{next.title}</p>
              </Link>
            ) : null}
          </nav>
        </article>

        <TableOfContents headings={note.headings} />
      </div>
    </>
  );
}
