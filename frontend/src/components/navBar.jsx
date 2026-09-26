"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import SearchModal from "@/components/SearchModal";
import { useHeaderCollapse } from "@/hooks/useHeaderCollapse";

export default function Navbar() {
  const { headerRef, iconRef, trackRef, wordmarkRef } = useHeaderCollapse();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navLinks = [
    { href: "/notes", label: "Notes" },
    { href: "/courses", label: "Courses" },
    { href: "/interview", label: "Interview Prep" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/about", label: "About" },
  ];

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#09090b]/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl transition-all duration-300"
      >
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link
            href="/"
            aria-label="Almanac — Home"
            className="group flex items-center gap-2.5 py-1 pr-3 text-sm font-bold tracking-tight text-white focus:outline-none"
          >
            <span
              ref={iconRef}
              aria-hidden="true"
              style={{ willChange: "transform" }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-zinc-700 bg-zinc-800/80 text-zinc-200 transition-all duration-300 group-hover:bg-zinc-700/80 group-hover:border-zinc-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </span>
            <span
              ref={trackRef}
              aria-hidden="true"
              className="inline-block overflow-hidden align-middle"
            >
              <span
                ref={wordmarkRef}
                style={{ willChange: "transform" }}
                className="inline-block whitespace-nowrap text-base font-bold tracking-tight text-white"
              >
                Almanac<span className="text-zinc-400 font-mono">.</span>
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 text-xs font-medium md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md transition-all duration-150 ${
                    isActive
                      ? "bg-zinc-800 text-white border border-zinc-700/80 font-semibold"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Controls & Mobile Toggle */}
          <div className="flex items-center gap-2">
            {/* Interactive Search Bar Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden items-center gap-2.5 rounded-md border border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 text-xs text-zinc-400 transition-all hover:border-zinc-700 hover:text-white hover:bg-zinc-800/80 sm:flex"
            >
              <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search library...</span>
              <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-700/60">
                ⌘K
              </kbd>
            </button>

            <ThemeToggle />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900/60 text-white transition hover:bg-zinc-800 md:hidden"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-zinc-800/80 bg-[#09090b]/95 px-4 py-4 backdrop-blur-xl md:hidden">
            <nav className="flex flex-col space-y-1.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-md px-4 py-2.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-zinc-800 text-white border border-zinc-700"
                        : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchOpen(true);
                }}
                className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-xs text-zinc-300 mt-2 text-left"
              >
                <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search library... (⌘K)
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Global Command-K Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}






