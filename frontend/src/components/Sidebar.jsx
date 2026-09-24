import Link from "next/link";

export default function Sidebar({ categories = [], activeCategory }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 space-y-6">
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-2xl">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-4">
            Domain Filter
          </h2>
          <div className="space-y-1.5">
            <Link
              href="/notes"
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                !activeCategory
                  ? "bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-400 border border-sky-500/30"
                  : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
              }`}
            >
              <span>All Notes</span>
              <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px]">
                {categories.reduce((acc, curr) => acc + curr.count, 0)}
              </span>
            </Link>

            {categories.map((category) => {
              const isActive = activeCategory === category.slug;
              return (
                <Link
                  key={category.slug}
                  href={`/notes?category=${category.slug}`}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-400 border border-sky-500/30"
                      : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <span>{category.label}</span>
                  <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] text-[var(--muted)]">
                    {category.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
            <span>⚡ Zero-Latency Engine</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            Notes are parsed locally from markdown files with live search & instant indexing.
          </p>
        </section>
      </div>
    </aside>
  );
}

