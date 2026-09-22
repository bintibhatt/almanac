import NoteCard from "@/components/NoteCard";
import Sidebar from "@/components/Sidebar";
import { getAllNotes, getCategories } from "@/lib/notes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Notes",
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
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-7 sm:px-6 sm:py-10 lg:grid-cols-[220px_1fr] lg:px-8">
      <Sidebar categories={categories} activeCategory={activeCategory} />

      <section>
        <div className="border-b border-[var(--border)] pb-8">
          <p className="text-sm font-medium text-[var(--accent)]">Library</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Engineering Notes
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Browse local markdown notes by recency or category.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <NoteCard key={note.slug} note={note} />
          ))}
        </div>
      </section>
    </div>
  );
}
