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

function getSharedFilePath(filename) {
  const candidatePaths = [
    path.resolve(process.cwd(), "shared", filename),
    path.resolve(process.cwd(), "..", "shared", filename),
    path.resolve(process.cwd(), "almanac", "shared", filename),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.resolve(process.cwd(), "..", "shared", filename);
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

const ACRONYMS = {
  ai: "AI",
  api: "API",
  rest: "REST",
  rag: "RAG",
  mcp: "MCP",
  sql: "SQL",
  kv: "KV",
  llm: "LLM",
  http: "HTTP",
  https: "HTTPS",
  ui: "UI",
  db: "DB",
  os: "OS",
  cpu: "CPU",
  tls: "TLS",
  hsts: "HSTS",
  bm25: "BM25",
  pwa: "PWA",
};

export function formatCategory(value) {
  if (!value || typeof value !== "string") return "";
  return value
    .split("-")
    .map((part) => {
      const lower = part.toLowerCase();
      if (ACRONYMS[lower]) {
        return ACRONYMS[lower];
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

export function formatTag(tag) {
  if (!tag || typeof tag !== "string") return "";
  return tag
    .split("-")
    .map((part) => {
      const lower = part.toLowerCase();
      if (ACRONYMS[lower]) {
        return ACRONYMS[lower];
      }
      return part;
    })
    .join("-");
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
  const { data, content: rawContent } = matter(raw);
  const relativePath = path.relative(KNOWLEDGE_PATH, filePath);
  const pathParts = relativePath.split(path.sep);
  const fileName = path.basename(filePath, path.extname(filePath));
  const category = data.category || pathParts[0] || "notes";
  const baseSlug = slugify(fileName);
  const fallbackSlug = slugify(relativePath);
  const slug = usedSlugs.has(baseSlug) ? fallbackSlug : baseSlug;

  usedSlugs.add(slug);

  // Strip duplicate leading H1 title if present at top of markdown body
  const trimmedRawContent = rawContent.trim();
  const content = trimmedRawContent.replace(/^#\s+[^\n]+\n*/, "").trim();

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
    content,
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

export function searchNotes(query = "", categoryFilter = null) {
  const normalizedQuery = query?.trim().toLowerCase();
  const targetCategory = categoryFilter?.trim().toLowerCase();

  let notes = getAllNotes();

  if (targetCategory && targetCategory !== "all") {
    notes = notes.filter((n) => n.category.toLowerCase() === targetCategory);
  }

  if (!normalizedQuery) {
    return targetCategory && targetCategory !== "all" ? notes : [];
  }

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);

  return notes
    .map((note) => {
      const title = note.title.toLowerCase();
      const description = note.description.toLowerCase();
      const category = `${note.category} ${note.categoryLabel}`.toLowerCase();
      const tags = note.tags.join(" ").toLowerCase();
      const content = plainTextFromMarkdown(note.content);
      const haystack = `${title} ${description} ${category} ${tags} ${content}`;

      // Every term in a multi-word query must match somewhere
      if (!terms.every((term) => haystack.includes(term))) {
        return null;
      }

      let score = 0;

      // Exact matches for full query
      if (title === normalizedQuery) {
        score += 200;
      } else if (title.includes(normalizedQuery)) {
        score += 100;
      }

      if (tags.includes(normalizedQuery)) {
        score += 60;
      }

      if (category.includes(normalizedQuery)) {
        score += 50;
      }

      if (description.includes(normalizedQuery)) {
        score += 30;
      }

      if (content.includes(normalizedQuery)) {
        score += 15;
      }

      // Ranking priorities term-by-term:
      // 1. title match (highest)
      // 2. tag/category match
      // 3. description match
      // 4. content match
      for (const term of terms) {
        if (title.startsWith(term)) {
          score += 40;
        } else if (title.includes(term)) {
          score += 25;
        }

        if (note.tags.some((t) => t.toLowerCase() === term)) {
          score += 30;
        } else if (tags.includes(term)) {
          score += 15;
        }

        if (note.category.toLowerCase() === term) {
          score += 25;
        } else if (category.includes(term)) {
          score += 12;
        }

        if (description.includes(term)) {
          score += 8;
        }

        if (content.includes(term)) {
          score += 2;
        }
      }

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

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

let cachedVectorIndex = null;
function getVectorIndex() {
  if (cachedVectorIndex) return cachedVectorIndex;
  try {
    const indexPath = getSharedFilePath("vector_index.json");
    if (fs.existsSync(indexPath)) {
      const data = JSON.parse(fs.readFileSync(indexPath, "utf8"));
      cachedVectorIndex = data;
      return data;
    }
  } catch (err) {
    console.warn("Could not load vector_index.json:", err.message);
  }
  return null;
}

export function getRelatedNotes(slug, limit = 4) {
  const allNotes = getAllNotes();
  const currentNote = allNotes.find((n) => n.slug === slug);
  if (!currentNote) return [];

  const otherNotes = allNotes.filter((n) => n.slug !== slug);
  const vectorIndex = getVectorIndex();

  if (vectorIndex && vectorIndex[slug]?.vector) {
    const currentVector = vectorIndex[slug].vector;
    const scored = otherNotes.map((note) => {
      let sim = 0;
      if (vectorIndex[note.slug]?.vector) {
        sim = cosineSimilarity(currentVector, vectorIndex[note.slug].vector);
      } else {
        const sameCat = note.category === currentNote.category ? 0.3 : 0;
        const sharedTags = note.tags.filter((t) => currentNote.tags.includes(t)).length * 0.15;
        sim = sameCat + sharedTags;
      }
      return { note, sim };
    });

    scored.sort((a, b) => b.sim - a.sim);
    return scored.slice(0, limit).map((s) => s.note);
  }

  // Fallback: category and tag similarity
  const scored = otherNotes.map((note) => {
    let score = 0;
    if (note.category === currentNote.category) score += 3;
    const sharedTags = note.tags.filter((t) => currentNote.tags.includes(t)).length;
    score += sharedTags * 2;
    return { note, score };
  });

  scored.sort((a, b) => b.score - a.score || new Date(b.note.published) - new Date(a.note.published));
  return scored.slice(0, limit).map((s) => s.note);
}

export function getSystemState() {
  try {
    const statePath = getSharedFilePath("state.json");
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, "utf8"));
    }
  } catch (err) {
    console.warn("Could not load state.json:", err.message);
  }
  return null;
}
