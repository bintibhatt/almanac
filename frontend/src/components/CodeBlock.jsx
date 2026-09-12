"use client";

import { isValidElement, useMemo, useState } from "react";

function getTextFromNode(node) {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getTextFromNode).join("");
  }

  if (isValidElement(node)) {
    return getTextFromNode(node.props.children);
  }

  return "";
}

export default function CodeBlock({ children, className = "" }) {
  const [copied, setCopied] = useState(false);
  const code = useMemo(() => getTextFromNode(children).replace(/\n$/, ""), [children]);
  const language = /language-([^\s]+)/.exec(className)?.[1];

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="code-shell group my-6 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--code-bg)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={copyCode}
          className="rounded-md px-2 py-1 text-xs font-medium text-[var(--muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-6">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}
