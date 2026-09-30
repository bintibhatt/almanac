"use client";

import { useEffect, useState } from "react";

export default function TableOfContents({ headings = [] }) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? null);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  useEffect(() => {
    if (!headings.length) return;

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter(Boolean);

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  return (
    <>
      {/* Mobile/Tablet Collapsible TOC */}
      <div className="xl:hidden my-6 border border-zinc-800 rounded-lg bg-zinc-900/40 overflow-hidden">
        <button
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-zinc-300 hover:text-zinc-100"
          aria-expanded={mobileExpanded}
        >
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span>On This Page ({headings.length} sections)</span>
          </div>
          <svg
            className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${mobileExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {mobileExpanded && (
          <nav className="px-4 pb-3 border-t border-zinc-800/80 pt-2">
            <ol className="space-y-1.5 text-xs">
              {headings.map((heading) => (
                <li key={`${heading.id}-${heading.text}`}>
                  <a
                    href={`#${heading.id}`}
                    onClick={() => setMobileExpanded(false)}
                    className={`block py-1 transition ${
                      heading.depth === 3 ? "pl-3 text-zinc-500" : "text-zinc-400"
                    } ${
                      activeId === heading.id
                        ? "text-violet-400 font-medium"
                        : "hover:text-zinc-200"
                    }`}
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>

      {/* Desktop Sticky Sidebar TOC */}
      <nav aria-label="Table of contents" className="hidden xl:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pl-6 border-l border-zinc-800/60">
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-3">
            On This Page
          </h2>
          <ol className="space-y-1 text-xs">
            {headings.map((heading) => (
              <li key={`${heading.id}-${heading.text}`}>
                <a
                  href={`#${heading.id}`}
                  className={`block py-1 rounded transition line-clamp-1 ${
                    heading.depth === 3 ? "pl-3.5 text-zinc-500" : ""
                  } ${
                    activeId === heading.id
                      ? "text-violet-400 font-medium translate-x-1 transition-transform"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </>
  );
}
