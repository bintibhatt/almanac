import { NextResponse } from "next/server";
import { searchNotes } from "@/lib/notes";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || null;

    const results = searchNotes(q, category);

    // Sanitize response items so large content strings aren't sending unnecessary payload
    const sanitized = results.map((note) => ({
      slug: note.slug,
      title: note.title,
      description: note.description,
      category: note.category,
      categoryLabel: note.categoryLabel,
      published: note.published,
      readingTime: note.readingTime,
      difficulty: note.difficulty,
      tags: note.tags,
    }));

    return NextResponse.json({
      query: q,
      category: category || "all",
      total: sanitized.length,
      results: sanitized,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal search error" },
      { status: 500 }
    );
  }
}
