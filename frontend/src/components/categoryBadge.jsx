export default function CategoryBadge({ children, className = "" }) {
  const label = typeof children === "string" ? children.toLowerCase() : "";

  let colorClasses = "bg-sky-500/15 text-sky-300 border-sky-500/30";
  
  if (label.includes("system") || label.includes("architecture")) {
    colorClasses = "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
  } else if (label.includes("backend") || label.includes("api") || label.includes("database")) {
    colorClasses = "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
  } else if (label.includes("devops") || label.includes("docker") || label.includes("cloud")) {
    colorClasses = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  } else if (label.includes("sec") || label.includes("auth")) {
    colorClasses = "bg-purple-500/15 text-purple-300 border-purple-500/30";
  } else if (label.includes("ai") || label.includes("ml") || label.includes("search")) {
    colorClasses = "bg-amber-500/15 text-amber-300 border-amber-500/30";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide transition-all backdrop-blur-md ${colorClasses} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {children}
    </span>
  );
}



