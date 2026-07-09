import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import { formatDate } from "@/utils/format";

export default function NoteCard({ note, featured = false }) {
  return (
    <article
      className={`group relative rounded-xl border border-[var(--border)] bg-[var(--surface)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] ${
        featured ? "p-5 sm:p-6" : "p-4 sm:p-5"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge>{note.categoryLabel}</CategoryBadge>
        <span className="text-xs text-[var(--muted)]">{note.readingTime}</span>
      </div>

      <h3
        className={`mt-4 font-semibold tracking-tight text-[var(--foreground)] ${
          featured ? "text-2xl sm:text-3xl" : "text-lg"
        }`}
      >
        <Link href={`/notes/${note.slug}`} className="outline-none after:absolute after:inset-0 after:rounded-xl focus:ring-2 focus:ring-[var(--focus)]">
          {note.title}
        </Link>
      </h3>

      <p className="mt-3 line-clamp-3 text-[0.95rem] leading-7 text-[var(--muted)]">
        {note.description}
      </p>

      <div className="mt-6 flex min-h-8 items-center justify-between gap-4 text-xs text-[var(--muted)]">
        <time dateTime={note.published}>{formatDate(note.published)}</time>
        <span className="font-medium text-[var(--accent)] transition group-hover:translate-x-0.5">
          Read
        </span>
      </div>
    </article>
  );
}
