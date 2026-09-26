import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>Almanac is a living engineering library.</p>
        <p>Built with ❤️ by Binti</p>
        <Link
          className="w-fit text-slate-400 hover:text-white transition-colors"
          href="/about"
        >
          About this library →
        </Link>
      </div>
    </footer>
  );
}
