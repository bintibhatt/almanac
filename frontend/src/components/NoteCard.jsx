import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import { formatDate } from "@/utils/format";

export default function NoteCard({ note, featured = false }) {
  return (
    <article
      className={`group relative flex flex-col justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-5 hover:border-zinc-700 hover:bg-zinc-900 transition ${
        featured ? "sm:p-7 border-zinc-800 bg-zinc-900/60" : ""
      }`}
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <CategoryBadge category={note.category} label={note.categoryLabel} />
          <span className="text-xs text-zinc-500 font-mono">
            {note.readingTime}
          </span>
        </div>

        <h3
          className={`font-medium tracking-tight text-zinc-100 transition-colors group-hover:text-violet-400 ${
            featured ? "text-xl sm:text-2xl" : "text-base"
          }`}
        >
          <Link href={`/notes/${note.slug}`} className="outline-none after:absolute after:inset-0 after:rounded-lg">
            {note.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-400">
          {note.description}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-zinc-800/60 pt-3 text-xs text-zinc-500">
        <time dateTime={note.published}>
          {formatDate(note.published)}
        </time>

        <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 transition group-hover:text-violet-400 group-hover:translate-x-0.5">
          <span>Read</span>
          <span>→</span>
        </span>
      </div>
    </article>
  );
}
