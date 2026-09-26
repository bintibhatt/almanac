import NoteCard from "@/components/NoteCard";
import Sidebar from "@/components/Sidebar";
import { getAllNotes, getCategories } from "@/lib/notes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Engineering Notes | Almanac",
  description: "Browse engineering notes in Almanac.",
};

export default async function NotesPage({ searchParams }) {
  const params = await searchParams;
  const activeCategory = params?.category;
  const categories = getCategories();
  const notes = getAllNotes().filter((note) =>
    activeCategory ? note.category === activeCategory : true,
  );

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[260px_1fr] lg:px-8">
      <Sidebar categories={categories} activeCategory={activeCategory} />

      <section className="space-y-8">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 backdrop-blur-2xl">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-0.5 text-xs font-mono text-[var(--muted-light)]">
              <span>Almanac Library</span>
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--foreground)]">
              Engineering Notes{" "}
              <span className="gradient-text font-normal">
                {activeCategory ? `• ${activeCategory.toUpperCase()}` : "& Guides"}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
              Explore technical guides, system design breakdowns, and production architectures.
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <NoteCard key={note.slug} note={note} />
          ))}
        </div>
      </section>
    </div>
  );
}


