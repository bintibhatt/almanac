"use client";

import { useState, useEffect } from "react";

export default function TrialNotice() {
  const [phase, setPhase] = useState("idle"); // "centered", "flying", "header", "idle"
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    // Check session storage to avoid annoying user repeatedly, or show on load
    const hasSeenNotice = sessionStorage.getItem("almanac-trial-notice-seen");
    if (!hasSeenNotice) {
      setPhase("centered");

      // Auto-fly to header after 4 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 4200);

      return () => clearTimeout(timer);
    } else {
      setPhase("header");
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("almanac-trial-notice-seen", "true");
    setPhase("flying");
    setTimeout(() => {
      setPhase("header");
    }, 600);
  };

  return (
    <>
      {/* 1. Centered Initial Modal Popup (Load State) */}
      {(phase === "centered" || phase === "flying") && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all duration-500 ${
            phase === "flying" ? "bg-black/0 opacity-0 pointer-events-none" : "bg-black/70 opacity-100"
          }`}
        >
          <div
            className={`relative w-full max-w-md overflow-hidden rounded-md border border-[var(--border-strong)] bg-[var(--surface-solid)] p-6 shadow-2xl backdrop-blur-xl transition-all duration-600 ${
              phase === "flying"
                ? "translate-x-[35vw] -translate-y-[40vh] scale-20 opacity-0"
                : "translate-x-0 translate-y-0 scale-100 opacity-100"
            }`}
          >
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1 text-[11px] font-mono text-[var(--accent)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
                </span>
                <span>SYSTEM STATUS • BETA TRIAL</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--muted)]">v2.0-preview</span>
            </div>

            {/* Title & Content */}
            <div className="mt-4 space-y-2">
              <h3 className="text-base font-bold text-[var(--foreground)] tracking-tight">
                Preview & Trial Mode Notice
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Almanac is operating in continuous preview status. All engineering notes and architecture guides are fully accessible, while experimental features like AI Interview Drills remain under active enhancement.
              </p>
            </div>

            {/* Action Bar */}
            <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4">
              <span className="text-[11px] text-[var(--muted)] font-mono">Collapsing to header...</span>
              <button
                onClick={handleDismiss}
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 shadow-sm"
              >
                <span>Acknowledge</span>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Header Info Button Icon + Hover Popover */}
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

        {/* Hover Popover */}
        {hovered && (
          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="absolute right-0 z-50 mt-2 w-72 rounded-md border border-[var(--border-strong)] bg-[var(--surface-solid)] p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                <span className="text-xs font-bold text-[var(--foreground)]">Beta Preview Notice</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--muted)]">v2.0-preview</span>
            </div>
            <p className="mt-2.5 text-[11px] text-[var(--muted)] leading-relaxed">
              This platform is operating in preview & trial status. Core guides are fully functional, while experimental AI features are undergoing continuous refinement.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
