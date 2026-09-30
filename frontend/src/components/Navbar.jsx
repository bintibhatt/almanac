"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import SearchModal from "@/components/SearchModal";
import PWAInstallButton from "@/components/PWAInstallButton";
import NotificationToggle from "@/components/NotificationToggle";
import { useHeaderCollapse } from "@/hooks/useHeaderCollapse";

export default function Navbar() {
  const { headerRef, iconRef, trackRef, wordmarkRef } = useHeaderCollapse();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Global / and Cmd+K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput = activeTag === "input" || activeTag === "textarea" || document.activeElement?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "/" && !isInput) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navLinks = [
    { href: "/notes", label: "Notes" },
    { href: "/courses", label: "Courses" },
    { href: "/interview", label: "Interview Prep" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/updates", label: "What's New" },
  ];

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/85 pt-[env(safe-area-inset-top)] backdrop-blur-md transition-all duration-300"
      >
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link
            href="/"
            aria-label="Almanac — Home"
            className="group flex items-center gap-2 py-1 pr-3 text-sm font-semibold tracking-tight text-zinc-100 focus:outline-none"
          >
            <span
              ref={iconRef}
              aria-hidden="true"
              style={{ willChange: "transform" }}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-violet-500/30 bg-violet-950/40 text-violet-300 transition-all duration-300 group-hover:border-violet-500/60"
            >
              <img src="/icons/almanac-logo.png" alt="Almanac Logo" className="h-4 w-4 object-contain" />
            </span>
            <span
              ref={trackRef}
              aria-hidden="true"
              className="inline-block overflow-hidden align-middle"
            >
              <span
                ref={wordmarkRef}
                style={{ willChange: "transform" }}
                className="inline-block whitespace-nowrap text-sm font-semibold tracking-tight text-zinc-100"
              >
                Almanac<span className="text-violet-400 font-mono">.</span>
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    isActive
                      ? "bg-zinc-800/90 text-violet-300 border border-zinc-700/60 font-medium"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Controls & Mobile Toggle */}
          <div className="flex items-center gap-2">
            {/* Command Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/80 px-2.5 sm:px-3 py-1.5 text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
              aria-label="Open search command palette"
            >
              <svg className="h-3.5 w-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">Search library...</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 border border-zinc-700/70 bg-zinc-800/60 rounded text-[10px] font-mono text-zinc-400">
                /
              </kbd>
            </button>

            <NotificationToggle className="hidden sm:inline-flex" />
            <PWAInstallButton />
            <ThemeToggle />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:bg-zinc-800 md:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-zinc-800/80 bg-zinc-950/95 px-4 py-4 backdrop-blur-md md:hidden">
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-md px-3 py-2 text-xs font-medium transition ${
                      isActive
                        ? "bg-zinc-800/80 text-violet-300 border border-zinc-700/60"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              >
                About
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Global Command Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
