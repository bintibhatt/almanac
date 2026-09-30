const ACRONYM_MAP = {
  ai: "AI",
  api: "API",
  rag: "RAG",
  mcp: "MCP",
  rest: "REST",
  sql: "SQL",
};

export default function CategoryBadge({ category, label, children, className = "" }) {
  const raw = label || children || category || "General";
  const displayLabel =
    typeof raw === "string" && ACRONYM_MAP[raw.toLowerCase()]
      ? ACRONYM_MAP[raw.toLowerCase()]
      : typeof raw === "string"
        ? raw.replace(/\bAi\b/g, "AI")
        : raw;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide bg-violet-950/40 text-violet-300 border border-violet-800/40 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
      {displayLabel}
    </span>
  );
}
