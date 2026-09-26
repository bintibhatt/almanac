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
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface-solid)] to-sky-500/5 p-6 sm:p-8 backdrop-blur-2xl shadow-xl shadow-black/10">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500" />
          <div className="space-y-3 max-w-2xl pt-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-mono text-sky-400 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
              Almanac Library
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


