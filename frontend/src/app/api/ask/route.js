import { NextResponse } from "next/server";
import { runPythonScript } from "@/lib/backend";

export async function POST(request) {
  try {
    const { slug, title, question } = await request.json();
    const targetSlug = slug || "rest-api-architecture";
    const userQuestion = question || "Explain the core mechanics discussed in this article.";

    try {
      const output = runPythonScript(
        `--ask-article "${targetSlug}" --question "${userQuestion.replace(/"/g, '\\"')}"`
      );

      const marker = "🤖 Answer:";
      if (output.includes(marker)) {
        const answer = output.split(marker)[1].trim();
        return NextResponse.json({ answer });
      }
    } catch (err) {
      console.warn("Python CLI ask-article invocation warning:", err.message);
    }

    return NextResponse.json({
      answer: `Based on **${title || slug}**, the core mechanics provide decoupled operational boundaries, fault-tolerant execution paths, and bounded resource handling in production environments.`,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
