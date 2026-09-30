export default function SearchBar({ compact = false, defaultValue = "" }) {
  return (
    <form
      role="search"
      aria-label="Search notes"
      action="/search"
      className="relative w-full"
    >
      <label className="sr-only" htmlFor={compact ? "site-search-compact" : "site-search"}>
        Search notes
      </label>
      <div className="relative flex items-center">
        <svg
          className="absolute left-3.5 h-4 w-4 text-zinc-500 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          id={compact ? "site-search-compact" : "site-search"}
          name="q"
          type="search"
          placeholder="Search topics, architecture, patterns..."
          defaultValue={defaultValue}
          className="h-10 sm:h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900/80 pl-10 pr-10 text-xs sm:text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20"
        />
        <kbd className="absolute right-3 hidden rounded border border-zinc-700/60 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 sm:inline-block pointer-events-none">
          /
        </kbd>
      </div>
    </form>
  );
}
