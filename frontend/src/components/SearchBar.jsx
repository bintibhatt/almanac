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
          className="absolute left-4 h-4 w-4 text-[var(--muted)] pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          id={compact ? "site-search-compact" : "site-search"}
          name="q"
          type="search"
          placeholder="Search topics, system design, architecture..."
          defaultValue={defaultValue}
          className="min-h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] pl-11 pr-12 text-xs sm:text-sm text-[var(--foreground)] outline-none backdrop-blur-md transition-all placeholder:text-[var(--muted)] focus:border-[var(--border-strong)] focus:bg-[var(--surface-hover)] focus:ring-2 focus:ring-[var(--focus)]"
        />
        <kbd className="absolute right-4 hidden rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-mono text-[var(--muted)] sm:inline-block">
          /
        </kbd>
      </div>
    </form>
  );
}


