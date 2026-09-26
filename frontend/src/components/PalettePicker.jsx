"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";

export default function PalettePicker() {
  const { palette, changePalette, PALETTES } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activePaletteObj = PALETTES.find((p) => p.id === palette) || PALETTES[0];

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--muted)] backdrop-blur-md transition-all hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
        aria-label="Choose color palette"
      >
        <span
          className="h-3 w-3 rounded-full border border-white/20 shadow-sm"
          style={{ backgroundColor: activePaletteObj.color }}
        />
        <span className="hidden sm:inline font-medium text-[11px]">{activePaletteObj.name}</span>
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-[var(--border-strong)] bg-[var(--surface-solid)] p-1.5 shadow-2xl backdrop-blur-xl">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
            Color Palettes
          </div>
          <div className="mt-1 space-y-1">
            {PALETTES.map((p) => {
              const isSelected = p.id === palette;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    changePalette(p.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs transition ${
                    isSelected
                      ? "bg-[var(--surface-hover)] font-semibold text-[var(--foreground)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: p.color }}
                    />
                    <span>{p.name}</span>
                  </div>
                  {isSelected && (
                    <svg className="h-3.5 w-3.5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
