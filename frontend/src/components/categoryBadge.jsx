export default function CategoryBadge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300 border border-white/10 ${className}`}
    >
      {children}
    </span>
  );
}




