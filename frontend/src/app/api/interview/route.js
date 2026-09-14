import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";

export async function POST(request) {
  try {
    const { slug, title } = await request.json();
    const scriptPath = path.resolve(process.cwd(), "..", "backend", "scripts", "run.py");
    const targetSlug = slug || "rest-api-architecture";

    try {
      const output = execSync(`python "${scriptPath}" --interview "${targetSlug}"`, {
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
      console.warn("Python CLI interview invocation warning:", err.message);
    }

    return NextResponse.json({
      questions: [
        {
          id: "iq1",
          level: "Intermediate",
          question: `How would you explain the core architecture of ${title || slug} during a system design interview?`,
          model_answer: `I would describe ${title || slug} by breaking down its ingress data flow, internal mechanics, resource limits, and failure recovery domains.`,
          follow_up_prompt: "How does this scale when network latency spikes across availability zones?",
        },
        {
          id: "iq2",
          level: "Senior",
          question: `What common production failure modes occur with ${title || slug} and how do you mitigate them?`,
          model_answer: "Failure modes include resource exhaustion and unhandled timeout cascades. Mitigation requires circuit breakers and strict resource quotas.",
          follow_up_prompt: "What telemetry metrics would you monitor on your dashboard?",
        },
      ],
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
