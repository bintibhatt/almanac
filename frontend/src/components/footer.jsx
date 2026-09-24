import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--border)] bg-[var(--background-alt)]/50 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand & Tagline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-600 text-xs font-black text-white shadow-md">
                ⚡
              </span>
              <span className="text-lg font-bold tracking-tight text-[var(--foreground)]">
                Almanac<span className="text-sky-400">.</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--muted)]">
              An interactive living engineering library and AI study companion for software engineers and architects.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
              Platform
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-[var(--muted)]">
              <li>
                <Link href="/notes" className="transition hover:text-[var(--accent)]">
                  Engineering Notes
                </Link>
              </li>
              <li>
                <Link href="/courses" className="transition hover:text-[var(--accent)]">
                  Interactive Courses
                </Link>
              </li>
              <li>
                <Link href="/interview" className="transition hover:text-[var(--accent)]">
                  AI Interview Prep
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="transition hover:text-[var(--accent)]">
                  Study Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Tech Topics */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
              Core Topics
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-[var(--muted)]">
              <li>
                <Link href="/notes?category=system-design" className="transition hover:text-[var(--accent)]">
                  System Design & Scalability
                </Link>
              </li>
              <li>
                <Link href="/notes?category=backend" className="transition hover:text-[var(--accent)]">
                  Backend Architectures
                </Link>
              </li>
              <li>
                <Link href="/notes?category=devops" className="transition hover:text-[var(--accent)]">
                  DevOps & Containers
                </Link>
              </li>
              <li>
                <Link href="/notes?category=security" className="transition hover:text-[var(--accent)]">
                  Application Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Info & Credit */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
              About & Author
            </h4>
            <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
              Curated notes and interactive exercises crafted for high-performance software development.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-xs">
              <Link
                href="/about"
                className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
              >
                About this library →
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)] sm:flex-row">
          <p>© {new Date().getFullYear()} Almanac Library. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Crafted with <span className="text-rose-500">❤️</span> by <span className="font-semibold text-[var(--foreground)]">Binti</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

