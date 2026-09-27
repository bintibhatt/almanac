import Link from "next/link";

export default function Sidebar({ categories = [], activeCategory }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 space-y-8">
        <section className="space-y-3">
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Domain Filter
          </h2>
          <div className="space-y-1">
            <Link
              href="/notes"
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-all ${
                !activeCategory
                  ? "bg-white/10 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>All Notes</span>
              <span className="font-mono text-[11px] text-slate-500">
                {categories.reduce((acc, curr) => acc + curr.count, 0)}
              </span>
            </Link>

            {categories.map((category) => {
              const isActive = activeCategory === category.slug;
              return (
                <Link
                  key={category.slug}
                  href={`/notes?category=${category.slug}`}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs transition-all ${
                    isActive
                      ? "bg-white/10 text-white font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{category.label}</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {category.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="border-t border-white/10 pt-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span>Fast Markdown Engine</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            Notes are parsed locally from markdown files with live search & instant indexing.
          </p>
        </section>
      </div>
    </aside>
  );
}


