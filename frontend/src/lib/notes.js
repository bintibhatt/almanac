import fs from "fs";
import path from "path";
import matter from "gray-matter";

const KNOWLEDGE_PATH = path.join(process.cwd(), "../knowledge");

export const getAllNotes = () => {
  const categories = fs.readdirSync(KNOWLEDGE_PATH);

  console.log(categories);

  const notes = [];

  categories.forEach((category) => {
    const categoryPath = path.join(KNOWLEDGE_PATH, category);

    const files = fs.readdirSync(categoryPath);

    files.forEach((file) => {
      const filePath = path.join(categoryPath, file);

      const fileContent = fs.readFileSync(filePath, "utf8");

      const { data, content } = matter(fileContent);

      notes.push({
        ...data,
        slug: file.replace(".md", ""),
        category,
        content,
      });
    });
  });

  return notes;
};