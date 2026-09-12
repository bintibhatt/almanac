"use client";

import { useEffect, useState } from "react";

export default function TableOfContents({ headings = [] }) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? null);

  useEffect(() => {
    if (!headings.length) {
      return;
    }

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter(Boolean);

    if (!elements.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) {
    return null;
  }

  return (
    <nav aria-label="Table of contents" className="hidden xl:block">
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pl-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          On This Page
        </h2>
        <ol className="mt-3 space-y-1">
          {headings.map((heading) => (
            <li key={`${heading.id}-${heading.text}`}>
              <a
                href={`#${heading.id}`}
                className={`block rounded-md py-1.5 text-sm transition ${
                  heading.depth === 3 ? "pl-4" : ""
                } ${
                  activeId === heading.id
                    ? "font-medium text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
