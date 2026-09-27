import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800/80 bg-[#09090b]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <img src="/icons/almanac-logo.png" alt="Almanac Logo" className="h-4 w-4 object-contain opacity-80" />
          <p>Almanac is a living engineering library.</p>
        </div>
        <p>Built by Binti</p>
        <Link
          className="w-fit text-zinc-400 hover:text-white transition-colors"
          href="/about"
        >
          About this library →
        </Link>
      </div>
    </footer>
  );
}

