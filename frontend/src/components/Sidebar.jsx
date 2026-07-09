import Link from "next/link";
import { pluralize } from "@/utils/format";

export default function Sidebar({ categories = [], activeCategory }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 space-y-6">
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Categories
          </h2>
          <div className="mt-3 space-y-1">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/notes?category=${category.slug}`}
                className={`flex min-h-11 items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                  activeCategory === category.slug
                    ? "bg-[var(--surface-muted)] text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <span>{category.label}</span>
                <span className="text-xs">{category.count}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="text-sm font-medium text-[var(--foreground)]">Reading Mode</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Notes are rendered from local markdown in the knowledge library and stay fast by default.
          </p>
        </section>
      </div>
    </aside>
  );
}
