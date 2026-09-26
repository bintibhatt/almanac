export default function CategoryBadge({ children, className = "" }) {
  const label = typeof children === "string" ? children.toLowerCase() : "";

  let colorClasses = "bg-[var(--surface-muted)] text-[var(--muted-light)] border-[var(--border)]";
  
  if (label.includes("system") || label.includes("architecture")) {
    colorClasses = "bg-indigo-500/10 text-indigo-300 border-indigo-500/20";
  } else if (label.includes("backend") || label.includes("api") || label.includes("database")) {
    colorClasses = "bg-sky-500/10 text-sky-300 border-sky-500/20";
  } else if (label.includes("devops") || label.includes("docker") || label.includes("cloud")) {
    colorClasses = "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
  } else if (label.includes("sec") || label.includes("auth")) {
    colorClasses = "bg-purple-500/10 text-purple-300 border-purple-500/20";
  } else if (label.includes("ai") || label.includes("ml")) {
    colorClasses = "bg-amber-500/10 text-amber-300 border-amber-500/20";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-tight transition-colors ${colorClasses} ${className}`}
    >
      <span className="h-1 w-1 rounded-full bg-current opacity-60" />
      {children}
    </span>
  );
}


