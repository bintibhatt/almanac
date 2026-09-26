import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import { formatDate } from "@/utils/format";

export default function NoteCard({ note, featured = false }) {
  return (
    <article
      className={`group relative flex flex-col justify-between rounded-md border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md transition-all duration-200 hover:border-sky-500/30 hover:bg-slate-900/80 hover:shadow-[0_4px_24px_-4px_rgba(56,189,248,0.08)] ${
        featured ? "sm:p-8" : ""
      }`}
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CategoryBadge>{note.categoryLabel}</CategoryBadge>
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {note.readingTime}
          </span>
        </div>

        <h3
          className={`mt-4 font-bold tracking-tight text-slate-100 transition-colors group-hover:text-sky-400 ${
            featured ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"
          }`}
        >
          <Link href={`/notes/${note.slug}`} className="outline-none after:absolute after:inset-0 after:rounded-md">
            {note.title}
          </Link>
        </h3>

        <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
          {note.description}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs font-medium text-slate-400">
        <time dateTime={note.published} className="flex items-center gap-1.5 text-xs text-slate-400">
          <svg className="h-3.5 w-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(note.published)}
        </time>

        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 transition-all duration-200 group-hover:text-sky-400 group-hover:translate-x-1">
          Read Note
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </span>
      </div>
    </article>
  );
}





