import { NextResponse } from "next/server";
import { runPythonScript, extractJsonFromOutput } from "@/lib/backend";

export async function POST(request) {
  try {
    const body = await request.json();
    const { topic, category = "backend", force = false } = body;

    const cleanTopic = (topic || "").trim();
    if (!cleanTopic) {
      return NextResponse.json({ error: "Topic title cannot be empty." }, { status: 400 });
    }

    if (cleanTopic.length > 200) {
      return NextResponse.json({ error: "Topic title exceeds maximum limit of 200 characters." }, { status: 400 });
    }

    // Escape quotes for CLI safety
    const safeTopic = cleanTopic.replace(/"/g, '\\"');
    const safeCat = (category || "backend").replace(/[^a-zA-Z0-9_-]/g, "");
    const forceFlag = force ? "--force" : "";

    try {
      const output = runPythonScript(
        `--generate-note "${safeTopic}" --category "${safeCat}" ${forceFlag} --no-git`
      );

      const parsed = extractJsonFromOutput(output);
      if (parsed) {
        return NextResponse.json(parsed);
      }
    } catch (err) {
      console.warn("Python generate-note invocation warning:", err.message);
    }

    // Fallback if Python execution unavailable
    return NextResponse.json({
      success: false,
      error: "Backend note generation service temporarily unavailable. Please verify python environment.",
    }, { status: 503 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
