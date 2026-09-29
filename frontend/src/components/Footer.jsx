import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950 mt-20">
      <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-xs text-zinc-500 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <img src="/icons/almanac-logo.png" alt="Almanac Logo" className="h-4 w-4 object-contain opacity-80" />
          <span>Almanac — Autonomous Engineering Knowledge Base.</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <Link href="/notes" className="hover:text-zinc-300 transition">
            Library
          </Link>
          <Link href="/updates" className="hover:text-zinc-300 transition">
            Roadmap
          </Link>
          <Link href="/dashboard" className="hover:text-zinc-300 transition">
            Dashboard
          </Link>
          <Link href="/about" className="hover:text-zinc-300 transition">
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}
