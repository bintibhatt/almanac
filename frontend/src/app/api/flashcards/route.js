import { NextResponse } from "next/server";
import { runPythonScript } from "@/lib/backend";

export async function POST(request) {
  try {
    const { slug, title, category, content } = await request.json();
    const targetSlug = slug || "rest-api-architecture";

    try {
      const output = runPythonScript(`--flashcards "${targetSlug}"`);
      const jsonStart = output.indexOf("[");
      const jsonEnd = output.lastIndexOf("]");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = output.slice(jsonStart, jsonEnd + 1);
        const cards = JSON.parse(jsonStr);
        return NextResponse.json({ cards });
      }
    } catch (err) {
      console.warn("Python CLI flashcard invocation warning:", err.message);
    }

    return NextResponse.json({
      cards: [
        {
          id: "fc1",
          concept: `${title || slug} Core Invariant`,
          question: `What core problem does ${title || slug} solve in software engineering?`,
          answer: `${title || slug} decouples operational dependencies and establishes fault-tolerant execution paths.`,
          difficulty: "Intermediate",
        },
        {
          id: "fc2",
          concept: `${title || slug} Production Trade-off`,
          question: `What is the primary trade-off when adopting ${title || slug}?`,
          answer: "Increased architectural complexity in exchange for higher throughput, elasticity, and isolation.",
          difficulty: "Intermediate",
        },
      ],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
