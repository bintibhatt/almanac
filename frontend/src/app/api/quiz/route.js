import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";

export async function POST(request) {
  try {
    const { slug, title, category, content } = await request.json();

    if (!title && !slug) {
      return NextResponse.json({ error: "Title or slug required" }, { status: 400 });
    }

    // Call Python QuizService backend via CLI orchestrator
    const scriptPath = path.resolve(process.cwd(), "..", "backend", "scripts", "run.py");
    const targetSlug = slug || "rest-api-architecture";

    try {
      const output = execSync(`python "${scriptPath}" --quiz "${targetSlug}"`, {
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      });

      const jsonStart = output.indexOf("[");
      const jsonEnd = output.lastIndexOf("]");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = output.slice(jsonStart, jsonEnd + 1);
        const questions = JSON.parse(jsonStr);
        return NextResponse.json({ questions });
      }
    } catch (err) {
      console.warn("Python CLI quiz invocation warning:", err.message);
    }

    // Fallback response if CLI execution is offline or unparseable
    return NextResponse.json({
      questions: [
        {
          id: "q1",
          question: `What is the primary architectural goal of ${title || slug}?`,
          options: [
            `To provide decoupled, scalable execution for ${title || slug}.`,
            "To eliminate all network latency permanently.",
            "To replace database storage with memory buffers.",
            "To bypass authorization checks in production.",
          ],
          correct_index: 0,
          difficulty: "Intermediate",
          explanation: `${title || slug} provides decoupled operational boundaries and predictable system behavior.`,
        },
        {
          id: "q2",
          question: `Which pitfall commonly affects systems using ${title || slug}?`,
          options: [
            "Over-configuration without monitoring metric thresholds.",
            "Using standard HTTP protocol methods.",
            "Writing automated unit test suites.",
            "Structuring markdown documentation headers.",
          ],
          correct_index: 0,
          difficulty: "Intermediate",
          explanation: "Misconfiguration and lack of operational metrics are key risks in production deployment.",
        },
      ],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
