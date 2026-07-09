import Link from "next/link";

export const metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[70svh] max-w-2xl flex-col justify-center px-4 py-16 sm:px-6">
      <p className="text-sm font-medium text-[var(--accent)]">Offline</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
        This note is not cached yet.
      </h1>
      <p className="mt-4 text-base leading-7 text-[var(--muted)]">
        Almanac keeps recently visited pages available for focused reading.
        Reconnect once, open the note again, and it will be easier to revisit.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 w-fit items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
      >
        Return home
      </Link>
    </div>
  );
}
