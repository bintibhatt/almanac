import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getPushSubscriptionsPath() {
  const candidatePaths = [
    path.resolve(process.cwd(), "shared", "push_subscriptions.json"),
    path.resolve(process.cwd(), "..", "shared", "push_subscriptions.json"),
    path.resolve(process.cwd(), "almanac", "shared", "push_subscriptions.json"),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.resolve(process.cwd(), "..", "shared", "push_subscriptions.json");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { subscription, action = "subscribe" } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
    }

    const filePath = getPushSubscriptionsPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let existing = [];
    if (fs.existsSync(filePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (!Array.isArray(existing)) existing = [];
      } catch {
        existing = [];
      }
    }

    if (action === "unsubscribe") {
      existing = existing.filter((s) => s.endpoint !== subscription.endpoint);
    } else {
      existing = existing.filter((s) => s.endpoint !== subscription.endpoint);
      existing.push({
        ...subscription,
        subscribedAt: new Date().toISOString(),
      });
    }

    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), "utf-8");

    return NextResponse.json({ success: true, count: existing.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
