export default function TableOfContents({ headings = [] }) {
  if (!headings.length) {
    return null;
  }

  return (
    <nav aria-label="Table of contents" className="hidden xl:block">
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pl-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          On This Page
        </h2>
        <ol className="mt-3 space-y-1">
          {headings.map((heading) => (
            <li key={`${heading.id}-${heading.text}`}>
              <a
                href={`#${heading.id}`}
                className={`block rounded-md py-1.5 text-sm text-[var(--muted)] transition hover:text-[var(--foreground)] ${
                  heading.depth === 3 ? "pl-4" : ""
                }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
