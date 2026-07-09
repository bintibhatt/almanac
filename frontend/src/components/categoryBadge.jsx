export default function CategoryBadge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border border-[var(--border)] bg-[var(--accent-muted)] px-3 py-1.5 text-xs font-medium text-[var(--accent)] ${className}`}
    >
      {children}
    </span>
  );
}
