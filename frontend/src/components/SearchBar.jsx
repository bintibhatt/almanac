export default function SearchBar({ compact = false, defaultValue = "" }) {
  return (
    <form
      role="search"
      aria-label="Search notes"
      action="/search"
      className="w-full"
    >
      <label className="sr-only" htmlFor={compact ? "site-search-compact" : "site-search"}>
        Search notes
      </label>
      <input
        id={compact ? "site-search-compact" : "site-search"}
        name="q"
        type="search"
        placeholder="Search library"
        defaultValue={defaultValue}
        className="min-h-11 w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-base text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--border-strong)] focus:ring-2 focus:ring-[var(--focus)] md:text-sm"
      />
    </form>
  );
}
