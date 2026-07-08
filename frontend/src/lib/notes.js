import fs from "fs";
import path from "path";
import matter from "gray-matter";

const KNOWLEDGE_DIR = path.join(process.cwd(), "../knowledge");

export function getAllNotes() {
  const notes = [];

  const categories = fs.readdirSync(KNOWLEDGE_DIR);

  categories.forEach((category) => {
    const categoryPath = path.join(KNOWLEDGE_DIR, category);

    const files = fs.readdirSync(categoryPath);

    files.forEach((file) => {
      const filePath = path.join(categoryPath, file);

      const content = fs.readFileSync(filePath, "utf8");

      const { data } = matter(content);

      notes.push({
        ...data,
        slug: file.replace(".md", ""),
        category,
      });
    });
  });

  return notes.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// getAllNotes();

// getNoteBySlug(slug);

// getLatestNotes(limit);
