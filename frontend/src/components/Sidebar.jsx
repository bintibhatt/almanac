import Link from "next/link";

export default function Sidebar({ categories = [], activeCategory }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 space-y-6">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-2xl">
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] mb-3">
            Domain Filter
          </h2>
          <div className="space-y-1">
            <Link
              href="/notes"
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                !activeCategory
                  ? "bg-[var(--surface-hover)] text-[var(--foreground)] font-semibold border border-[var(--border-strong)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <span>All Notes</span>
              <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-mono text-[var(--muted)]">
                {categories.reduce((acc, curr) => acc + curr.count, 0)}
              </span>
            </Link>

            {categories.map((category) => {
              const isActive = activeCategory === category.slug;
              return (
                <Link
                  key={category.slug}
                  href={`/notes?category=${category.slug}`}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[var(--surface-hover)] text-[var(--foreground)] font-semibold border border-[var(--border-strong)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <span>{category.label}</span>
                  <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-mono text-[var(--muted)]">
                    {category.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)]">
            <span>Fast Markdown Engine</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            Notes are parsed locally from markdown files with live search & instant indexing.
          </p>
        </section>
      </div>
    </aside>
  );
}


