import Link from "next/link";

export default function Sidebar({ categories = [], activeCategory }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 space-y-6">
        <section className="rounded-3xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 backdrop-blur-2xl shadow-xl shadow-black/10">
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-sky-400 mb-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            Domain Filter
          </h2>
          <div className="space-y-1.5">
            <Link
              href="/notes"
              className={`flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                !activeCategory
                  ? "bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 text-[var(--foreground)] border border-sky-500/40 shadow-sm"
                  : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <span>All Notes</span>
              <span className="rounded-full bg-[var(--surface-solid)] border border-[var(--border)] px-2.5 py-0.5 text-[10px] font-mono text-[var(--muted-light)]">
                {categories.reduce((acc, curr) => acc + curr.count, 0)}
              </span>
            </Link>

            {categories.map((category) => {
              const isActive = activeCategory === category.slug;
              return (
                <Link
                  key={category.slug}
                  href={`/notes?category=${category.slug}`}
                  className={`flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 text-[var(--foreground)] border border-indigo-500/40 shadow-sm"
                      : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <span>{category.label}</span>
                  <span className="rounded-full bg-[var(--surface-solid)] border border-[var(--border)] px-2.5 py-0.5 text-[10px] font-mono text-[var(--muted-light)]">
                    {category.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent p-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)]">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
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


