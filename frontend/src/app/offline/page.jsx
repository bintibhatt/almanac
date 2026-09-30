import Link from "next/link";

export const metadata = {
  title: "Offline Reader | Almanac",
  description: "Offline fallback page for uncached engineering notes in Almanac.",
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center px-4 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 mb-4">
        <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.828m2.829 2.828L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.828m-4.243 4.243a9 9 0 01-12.728 0m0 0l2.828-2.828m-2.828 2.828L3 21m2.828-5.656a5 5 0 010-7.072m0 0l2.828 2.828" />
        </svg>
      </div>
      <span className="text-xs font-mono uppercase tracking-wider text-violet-400">Offline Mode</span>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100">
        This article is not cached yet
      </h1>
      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-400">
        Almanac caches previously visited guides offline via Service Worker. Connect to the network once to cache this guide for offline reading.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition"
        >
          Return Home
        </Link>
        <Link
          href="/notes"
          className="rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition"
        >
          Browse Library
        </Link>
      </div>
    </div>
  );
}
