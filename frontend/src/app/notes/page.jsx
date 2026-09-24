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
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 backdrop-blur-2xl">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-bold text-sky-400">
              <span>📚 Almanac Library</span>
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-[var(--foreground)]">
              Engineering Notes <br />
              <span className="gradient-text">
                {activeCategory ? `• ${activeCategory.toUpperCase()}` : "& Technical Guides"}
              </span>
            </h1>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Explore deep technical guides, system design breakdowns, and production architectures.
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

