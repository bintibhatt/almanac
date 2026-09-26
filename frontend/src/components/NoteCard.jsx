import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import { formatDate } from "@/utils/format";

export default function NoteCard({ note, featured = false }) {
  return (
    <article
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)] hover:shadow-xl ${
        featured ? "sm:p-8" : ""
      }`}
    >
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CategoryBadge>{note.categoryLabel}</CategoryBadge>
          <span className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--muted)]">
            <svg className="h-3 w-3 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {note.readingTime}
          </span>
        </div>

        <h3
          className={`mt-4 font-bold tracking-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)] ${
            featured ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"
          }`}
        >
          <Link href={`/notes/${note.slug}`} className="outline-none after:absolute after:inset-0 after:rounded-2xl">
            {note.title}
          </Link>
        </h3>

        <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-[var(--muted)] sm:text-sm">
          {note.description}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs font-medium text-[var(--muted)]">
        <time dateTime={note.published} className="flex items-center gap-1 text-[11px]">
          <svg className="h-3.5 w-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(note.published)}
        </time>

        <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--foreground)] transition-transform duration-200 group-hover:translate-x-0.5">
          Read
          <svg className="h-3.5 w-3.5 text-[var(--muted)] group-hover:text-[var(--foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </span>
      </div>
    </article>
  );
}


