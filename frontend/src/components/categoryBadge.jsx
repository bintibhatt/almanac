export default function CategoryBadge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-300 border border-sky-500/20 ${className}`}
    >
      {children}
    </span>
  );
}





