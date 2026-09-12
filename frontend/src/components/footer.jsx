import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>Almanac is a living engineering library.</p>
        <p>Hello</p>
        <Link
          className="w-fit underline-offset-4 hover:text-[var(--foreground)] hover:underline"
          href="/about"
        >
          About this library
        </Link>
      </div>
    </footer>
  );
}
