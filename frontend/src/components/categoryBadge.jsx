export default function CategoryBadge({ children, className = "" }) {
  const label = typeof children === "string" ? children.toLowerCase() : "";

  let colorClasses = "bg-sky-500/10 text-sky-400 border-sky-500/20";
  
  if (label.includes("system") || label.includes("architecture")) {
    colorClasses = "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
  } else if (label.includes("backend") || label.includes("api") || label.includes("database")) {
    colorClasses = "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
  } else if (label.includes("devops") || label.includes("docker") || label.includes("cloud")) {
    colorClasses = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  } else if (label.includes("sec") || label.includes("auth")) {
    colorClasses = "bg-violet-500/15 text-violet-400 border-violet-500/30";
  } else if (label.includes("front") || label.includes("ui") || label.includes("react")) {
    colorClasses = "bg-rose-500/15 text-rose-400 border-rose-500/30";
  } else if (label.includes("ai") || label.includes("ml")) {
    colorClasses = "bg-amber-500/15 text-amber-400 border-amber-500/30";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide transition-all ${colorClasses} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75 animate-pulse" />
      {children}
    </span>
  );
}

