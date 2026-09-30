import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export function getBackendScriptPath() {
  const candidatePaths = [
    path.resolve(process.cwd(), "backend", "scripts", "run.py"),
    path.resolve(process.cwd(), "..", "backend", "scripts", "run.py"),
    path.resolve(process.cwd(), "almanac", "backend", "scripts", "run.py"),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.resolve(process.cwd(), "..", "backend", "scripts", "run.py");
}

export function runPythonScript(args) {
  const scriptPath = getBackendScriptPath();
  const pythonCmds = ["python", "python3", "py"];

  for (const py of pythonCmds) {
    try {
      const output = execSync(`${py} "${scriptPath}" ${args}`, {
        encoding: "utf-8",
        maxBuffer: 15 * 1024 * 1024,
      });
      return output;
    } catch {
      continue;
    }
  }

  throw new Error("Failed to execute python backend script");
}

export function extractJsonFromOutput(output) {
  if (!output || typeof output !== "string") return null;

  const startBrace = output.indexOf("{");
  const startBracket = output.indexOf("[");
  let start = -1;
  let isArray = false;

  if (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
    start = startBrace;
    isArray = false;
  } else if (startBracket !== -1) {
    start = startBracket;
    isArray = true;
  }

  if (start === -1) return null;

  const end = isArray ? output.lastIndexOf("]") : output.lastIndexOf("}");
  if (end === -1 || end < start) return null;

  try {
    const jsonStr = output.slice(start, end + 1);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}
