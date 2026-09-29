import { getAllNotes, getCategories } from "@/lib/notes";
import NotesClient from "./NotesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Engineering Library | Almanac",
  description: "Curated, production-grade technical articles on AI, distributed systems, backend architecture, and infrastructure.",
};

export default function NotesPage() {
  const notes = getAllNotes().map((n) => ({
    slug: n.slug,
    title: n.title,
    description: n.description,
    category: n.category,
    categoryLabel: n.categoryLabel,
    tags: n.tags,
    readingTime: n.readingTime,
    difficulty: n.difficulty,
    published: n.published,
  }));

  const categories = getCategories();

  return <NotesClient notes={notes} categories={categories} />;
}
