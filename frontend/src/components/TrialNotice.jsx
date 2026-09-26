"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function TrialNotice() {
  const [phase, setPhase] = useState("centered"); // "centered", "flying", "header"
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPhase("centered");

    // Auto collapse into header icon after 4.5 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setPhase("flying");
    setTimeout(() => {
      setPhase("header");
    }, 650);
  };

  const modalOverlay =
    mounted && (phase === "centered" || phase === "flying")
      ? createPortal(
          <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-500 ${
              phase === "flying" ? "bg-black/0 opacity-0 pointer-events-none" : "bg-black/80 backdrop-blur-md opacity-100"
            }`}
          >
            <div
              className={`relative w-full max-w-lg rounded-lg border border-[var(--border-strong)] bg-[#18181b] p-7 shadow-2xl backdrop-blur-2xl transition-all duration-700 ease-out ${
                phase === "flying"
                  ? "translate-x-[38vw] -translate-y-[42vh] scale-15 opacity-0"
                  : "translate-x-0 translate-y-0 scale-100 opacity-100"
              }`}
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-mono font-semibold text-[var(--accent)]">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                  </span>
                  <span>SYSTEM STATUS • BETA PREVIEW</span>
                </div>
                <span className="text-xs font-mono text-[var(--muted)]">v2.0-preview</span>
              </div>

              {/* Title & Body */}
              <div className="mt-5 space-y-3">
                <h3 className="text-xl font-extrabold text-[var(--foreground)] tracking-tight">
                  Preview & Trial Mode Active
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">
                  Almanac is currently operating in preview and trial status. Technical guides are fully accessible, while select experimental modules (including AI Mock Interviews & Vector Search) are undergoing active enhancement.
                </p>
              </div>

              {/* Action Footer */}
              <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4">
                <span className="text-xs text-[var(--muted)] font-mono">Collapsing to header info badge...</span>
                <button
                  onClick={handleDismiss}
                  className="inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90 shadow-md"
                >
                  <span>Acknowledge</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {modalOverlay}

      {/* 2. Header Information Icon Button & Popover */}
      <div className="relative inline-block text-left">
        <button
          type="button"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => setHovered(!hovered)}
          className="relative flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] backdrop-blur-md transition-all hover:border-[var(--border-strong)] hover:text-[var(--foreground)] focus:outline-none"
          aria-label="System status notice"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
          </span>
        </button>

        {/* Hover Popover Card */}
        {hovered && (
          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="absolute right-0 z-50 mt-2 w-80 rounded-md border border-[var(--border-strong)] bg-[#18181b] p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                <span className="text-xs font-bold text-[var(--foreground)]">Beta Preview Notice</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--muted)]">v2.0-preview</span>
            </div>
            <p className="mt-2.5 text-xs text-[var(--muted)] leading-relaxed">
              This platform is operating in continuous preview & trial status. Technical notes are stable and complete, while AI interview modules are undergoing continuous improvement.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
