"use client";

import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import ThemeToggle from "@/components/ThemeToggle";
import { useHeaderCollapse } from "@/hooks/useHeaderCollapse";

export default function Navbar() {
  const { headerRef, iconRef, trackRef, wordmarkRef } = useHeaderCollapse();

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/84"
    >
      <div className="mx-auto flex min-h-14 max-w-7xl items-center gap-2 px-3 py-2 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Almanac — Home"
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-full px-1.5 pr-3 text-sm font-semibold tracking-tight text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
        >
          {/* The icon is the "portal" — the wordmark visually feeds into it. */}
          <span
            ref={iconRef}
            aria-hidden="true"
            style={{ willChange: "transform" }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-bold text-[var(--accent)]"
          >
            A
          </span>
          {/*
            trackRef is an overflow-hidden box that ends up exactly as wide
            as the wordmark (a plain layout side-effect of wrapping an
            inline-block child — CSS transforms never resize their box).
            Its left edge sitting flush next to the icon is what makes
            letters sliding past it read as "swallowed" rather than
            "slid off screen". See useHeaderCollapse for the full technique.
          */}
          <span
            ref={trackRef}
            aria-hidden="true"
            className="inline-block overflow-hidden align-middle"
          >
            <span
              ref={wordmarkRef}
              style={{ willChange: "transform" }}
              className="inline-block whitespace-nowrap"
            >
              Almanac
            </span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 text-sm text-[var(--muted)]">
          <Link className="inline-flex min-h-11 items-center rounded-full px-3.5 transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]" href="/notes">
            Notes
          </Link>
          <Link className="inline-flex min-h-11 items-center rounded-full px-3.5 transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]" href="/courses">
            Courses
          </Link>
          <Link className="inline-flex min-h-11 items-center rounded-full px-3.5 transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]" href="/interview">
            Interview Prep
          </Link>
          <Link className="inline-flex min-h-11 items-center rounded-full px-3.5 transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]" href="/about">
            About
          </Link>
        </nav>

        {/* <div className="hidden w-full max-w-xs md:block">
          <SearchBar compact />
        </div> */}

        <ThemeToggle />
      </div>
    </header>
  );
}
