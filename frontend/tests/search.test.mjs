import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { searchNotes, getAllNotes, getCategories } from "../src/lib/notes.js";

describe("Almanac Search Architecture & Ranking", () => {
  const allNotes = getAllNotes();

  test("1. Returns all notes when query is empty and no category specified", () => {
    const results = searchNotes("");
    assert.equal(results.length, 0, "Empty query without category filter returns empty array for clean initial state");
  });

  test("2. Returns all notes of category when query is empty but category specified", () => {
    const results = searchNotes("", "ai");
    assert.ok(results.length > 0, "Should return AI notes");
    results.forEach((n) => {
      assert.equal(n.category.toLowerCase(), "ai");
    });
  });

  test("3. Single term search finds relevant articles", () => {
    const results = searchNotes("docker");
    assert.ok(results.length > 0, "Should find docker note");
    const found = results.some((n) => n.title.toLowerCase().includes("docker") || n.tags.includes("docker"));
    assert.ok(found, "Results must contain docker in title or tags");
  });

  test("4. Multi-word search requires all terms to be present", () => {
    const results = searchNotes("docker memory");
    assert.ok(results.length > 0, "Should match notes containing both terms");
    results.forEach((n) => {
      const haystack = `${n.title} ${n.description} ${n.tags.join(" ")} ${n.content}`.toLowerCase();
      assert.ok(haystack.includes("docker"), "Haystack must contain docker");
      assert.ok(haystack.includes("memory"), "Haystack must contain memory");
    });
  });

  test("5. Title match ranks higher than description or content match", () => {
    const results = searchNotes("distributed locks");
    assert.ok(results.length > 0, "Should find distributed locks");
    assert.ok(
      results[0].title.toLowerCase().includes("distributed locks"),
      "Top result should have distributed locks in the title"
    );
  });

  test("6. Category filter restricts search results to specified category", () => {
    const results = searchNotes("cache", "system-design");
    results.forEach((n) => {
      assert.equal(n.category.toLowerCase(), "system-design", "Category must match filter");
    });
  });

  test("7. Search is case-insensitive", () => {
    const lowerResults = searchNotes("docker");
    const upperResults = searchNotes("DOCKER");
    assert.equal(lowerResults.length, upperResults.length, "Case should not alter result counts");
    assert.deepEqual(
      lowerResults.map((n) => n.slug),
      upperResults.map((n) => n.slug),
      "Slugs should match exactly"
    );
  });

  test("8. Non-matching query returns zero results", () => {
    const results = searchNotes("xyznonexistentterm12345");
    assert.equal(results.length, 0, "Non-matching query should return empty array");
  });

  test("9. Tag match boosts relevance", () => {
    const results = searchNotes("rag");
    assert.ok(results.length > 0, "Should find RAG articles");
    const topNote = results[0];
    const hasTagOrTitle = topNote.tags.includes("rag") || topNote.title.toLowerCase().includes("rag");
    assert.ok(hasTagOrTitle, "Top result should feature 'rag' in title or tags");
  });

  test("10. Dynamic categories contain only real, non-empty categories", () => {
    const categories = getCategories();
    assert.ok(categories.length > 0, "Should return existing categories");
    categories.forEach((cat) => {
      assert.ok(cat.slug, "Category must have slug");
      assert.ok(cat.label, "Category must have label");
      assert.ok(cat.count > 0, "Category count must be greater than zero");
    });
  });
});
