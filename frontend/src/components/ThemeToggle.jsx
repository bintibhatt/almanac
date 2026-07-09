"use client";

import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = theme ? (isDark ? "Light" : "Dark") : "Theme";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex min-h-11 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
      aria-label={theme ? `Switch to ${isDark ? "light" : "dark"} theme` : "Toggle theme"}
    >
      {label}
    </button>
  );
}
