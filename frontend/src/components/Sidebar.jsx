import Link from "next/link";

export default function Sidebar({ categories = [], activeCategory }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 space-y-6">
        <section className="space-y-2">
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
            Domain Filter
          </h2>
          <div className="space-y-1">
            <Link
              href="/notes"
              className={`flex items-center justify-between rounded-md px-3 py-1.5 text-xs transition ${
                !activeCategory
                  ? "bg-violet-950/60 text-violet-300 border border-violet-800/50 font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <span>All Notes</span>
              <span className="font-mono text-[11px] text-zinc-500">
                {categories.reduce((acc, curr) => acc + curr.count, 0)}
              </span>
            </Link>

            {categories.map((category) => {
              const isActive = activeCategory === category.slug;
              return (
                <Link
                  key={category.slug}
                  href={`/notes?category=${category.slug}`}
                  className={`flex items-center justify-between rounded-md px-3 py-1.5 text-xs transition ${
                    isActive
                      ? "bg-violet-950/60 text-violet-300 border border-violet-800/50 font-medium"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  <span>{category.label}</span>
                  <span className="font-mono text-[11px] text-zinc-500">
                    {category.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="border-t border-zinc-800/80 pt-4 space-y-1">
          <div className="text-xs font-medium text-zinc-300">
            Vector Semantic Engine
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Markdown guides are parsed and indexed with precomputed dense embeddings for related article cross-referencing.
          </p>
        </section>
      </div>
    </aside>
  );
}
