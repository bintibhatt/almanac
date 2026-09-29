import { getAllNotes, getCategories } from "@/lib/notes";
import SearchClient from "./SearchClient";

export const metadata = {
  title: "Search Engineering Library | Almanac",
  description: "Search production-grade engineering guides, architectural patterns, and deep dives.",
};

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const initialQuery = typeof params?.q === "string" ? params.q.trim() : "";
  const initialCategory = typeof params?.category === "string" ? params.category.trim() : "all";

  const allNotes = getAllNotes().map((n) => ({
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

  return (
    <SearchClient
      initialQuery={initialQuery}
      initialCategory={initialCategory}
      categories={categories}
      allNotes={allNotes}
    />
  );
}
