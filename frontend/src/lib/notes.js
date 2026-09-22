import fs from "fs";
import path from "path";
import matter from "gray-matter";
import GithubSlugger from "github-slugger";

function getKnowledgePath() {
  const candidatePaths = [
    path.resolve(process.cwd(), "knowledge"),
    path.resolve(process.cwd(), "..", "knowledge"),
    path.resolve(process.cwd(), "almanac", "knowledge"),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.resolve(process.cwd(), "..", "knowledge");
}

const KNOWLEDGE_PATH = getKnowledgePath();
const MARKDOWN_EXTENSION = /\.(md|mdx)$/i;

function exists(filePath) {
  return fs.existsSync(filePath);
}

function walkMarkdownFiles(directory) {
  if (!exists(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return walkMarkdownFiles(entryPath);
    }

    if (entry.isFile() && MARKDOWN_EXTENSION.test(entry.name)) {
      return [entryPath];
    }

    return [];
  });
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\\/g, "/")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9/]+/g, "-")
    .replace(/\//g, "-")
    .replace(/^-+|-+$/g, "");
}

function wordsFromMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#>*_\-[\]()`|]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function plainTextFromMarkdown(markdown) {
  return wordsFromMarkdown(markdown).join(" ").toLowerCase();
}

function calculateReadingTime(markdown) {
  const minutes = Math.max(1, Math.ceil(wordsFromMarkdown(markdown).length / 220));
  return `${minutes} min read`;
}

function excerptFromMarkdown(markdown) {
  const paragraph = markdown
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith("#") && !block.startsWith("```"));

  if (!paragraph) {
    return "A concise engineering note from the Almanac library.";
  }

  return paragraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function normalizeDate(value, fallback) {
  const date = value ? new Date(value) : fallback;

  if (Number.isNaN(date.getTime())) {
    return fallback.toISOString();
  }

  return date.toISOString();
}

function formatCategory(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractHeadings(content) {
  const slugger = new GithubSlugger();

  return content
    .split("\n")
    .map((line) => {
      const match = /^(#{1,3})\s+(.+)$/.exec(line.trim());

      if (!match) {
        return null;
      }

      const text = match[2]
        .replace(/[#*_`~[\]()]/g, "")
        .trim();

      const heading = {
        id: slugger.slug(text),
        text,
        depth: match[1].length,
      };

      return heading.depth > 1 ? heading : null;
    })
    .filter(Boolean);
}

function buildNote(filePath, usedSlugs) {
  const raw = fs.readFileSync(filePath, "utf8");
  const stats = fs.statSync(filePath);
  const { data, content } = matter(raw);
  const relativePath = path.relative(KNOWLEDGE_PATH, filePath);
  const pathParts = relativePath.split(path.sep);
  const fileName = path.basename(filePath, path.extname(filePath));
  const category = data.category || pathParts[0] || "notes";
  const baseSlug = slugify(fileName);
  const fallbackSlug = slugify(relativePath);
  const slug = usedSlugs.has(baseSlug) ? fallbackSlug : baseSlug;

  usedSlugs.add(slug);

  const published = normalizeDate(data.published || data.date, stats.mtime);
  const tags = Array.isArray(data.tags)
    ? data.tags
    : typeof data.tags === "string"
      ? data.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [];

  return {
    title: data.title || formatCategory(fileName.replace(/-/g, " ")),
    description: data.description || excerptFromMarkdown(content),
    category,
    categoryLabel: formatCategory(category),
    tags,
    published,
    readingTime: data.readingTime || calculateReadingTime(content),
    difficulty: data.difficulty || "Intermediate",
    slug,
    content: content.trim(),
    headings: extractHeadings(content),
    relativePath: relativePath.replace(/\\/g, "/"),
  };
}

export function getAllNotes() {
  const usedSlugs = new Set();

  return walkMarkdownFiles(KNOWLEDGE_PATH)
    .map((filePath) => buildNote(filePath, usedSlugs))
    .sort((a, b) => new Date(b.published) - new Date(a.published));
}

export function getLatestNotes(limit = 6) {
  return getAllNotes().slice(0, limit);
}

export function getNoteBySlug(slug) {
  return getAllNotes().find((note) => note.slug === slug) || null;
}

export function getCategories() {
  const categoryMap = new Map();

  getAllNotes().forEach((note) => {
    const current = categoryMap.get(note.category) || {
      slug: note.category,
      label: note.categoryLabel,
      count: 0,
      latest: note.published,
    };

    categoryMap.set(note.category, {
      ...current,
      count: current.count + 1,
      latest: new Date(note.published) > new Date(current.latest)
        ? note.published
        : current.latest,
    });
  });

  return Array.from(categoryMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

export function searchNotes(query) {
  const normalizedQuery = query?.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);

  return getAllNotes()
    .map((note) => {
      const title = note.title.toLowerCase();
      const description = note.description.toLowerCase();
      const category = `${note.category} ${note.categoryLabel}`.toLowerCase();
      const tags = note.tags.join(" ").toLowerCase();
      const content = plainTextFromMarkdown(note.content);
      const haystack = `${title} ${description} ${category} ${tags} ${content}`;

      if (!terms.every((term) => haystack.includes(term))) {
        return null;
      }

      const score = terms.reduce((total, term) => {
        let nextScore = total;

        if (title.includes(term)) nextScore += 8;
        if (description.includes(term)) nextScore += 4;
        if (category.includes(term)) nextScore += 3;
        if (tags.includes(term)) nextScore += 3;
        if (content.includes(term)) nextScore += 1;

        return nextScore;
      }, 0);

      return { ...note, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || new Date(b.published) - new Date(a.published));
}

export function getAdjacentNotes(slug) {
  const notes = getAllNotes();
  const index = notes.findIndex((note) => note.slug === slug);

  return {
    previous: index > 0 ? notes[index - 1] : null,
    next: index >= 0 && index < notes.length - 1 ? notes[index + 1] : null,
  };
}
