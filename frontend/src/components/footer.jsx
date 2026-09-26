import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative border-t border-[var(--border)] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/40 via-purple-500/40 to-transparent" />
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Almanac is a living engineering library.
        </p>
        <p>Built with ❤️ by Binti</p>
        <Link
          className="w-fit rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3.5 py-1 text-xs font-medium text-[var(--foreground)] transition-all hover:border-sky-500/40 hover:bg-sky-500/10"
          href="/about"
        >
          About this library →
        </Link>
      </div>
    </footer>
  );
}
