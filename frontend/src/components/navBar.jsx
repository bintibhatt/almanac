"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { useHeaderCollapse } from "@/hooks/useHeaderCollapse";

export default function Navbar() {
  const { headerRef, iconRef, trackRef, wordmarkRef } = useHeaderCollapse();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/notes", label: "Notes" },
    { href: "/courses", label: "Courses" },
    { href: "/interview", label: "Interview Prep" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/about", label: "About" },
  ];

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl transition-all"
    >
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          aria-label="Almanac — Home"
          className="group flex items-center gap-2.5 rounded-full py-1 pr-3 text-sm font-bold tracking-tight text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
        >
          <span
            ref={iconRef}
            aria-hidden="true"
            style={{ willChange: "transform" }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-600 text-xs font-black text-white shadow-lg shadow-sky-500/20 transition-transform group-hover:scale-105"
          >
            ⚡
          </span>
          <span
            ref={trackRef}
            aria-hidden="true"
            className="inline-block overflow-hidden align-middle"
          >
            <span
              ref={wordmarkRef}
              style={{ willChange: "transform" }}
              className="inline-block whitespace-nowrap text-lg font-extrabold tracking-tight"
            >
              Almanac<span className="text-sky-400">.</span>
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-[var(--surface-hover)] text-[var(--foreground)] font-semibold shadow-sm border border-[var(--border-strong)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls & Mobile Toggle */}
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--foreground)] sm:flex"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search...</span>
            <kbd className="rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--muted)] border border-[var(--border)]">
              ⌘K
            </kbd>
          </Link>

          <ThemeToggle />

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition hover:bg-[var(--surface-hover)] md:hidden"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--background)]/95 px-4 py-4 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-[var(--accent-muted)] text-[var(--accent)] font-semibold border border-sky-500/20"
                      : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search engineering library
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

