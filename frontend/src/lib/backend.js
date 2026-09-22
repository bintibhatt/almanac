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
        maxBuffer: 10 * 1024 * 1024,
      });
      return output;
    } catch {
      continue;
    }
  }

  throw new Error("Failed to execute python backend script");
}
