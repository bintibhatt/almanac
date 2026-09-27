export default function CategoryBadge({ children, className = "" }) {
  const label = typeof children === "string" ? children.toLowerCase() : "";

  let badgeColor = "bg-sky-500/10 text-sky-400 border-sky-500/30";
  if (label.includes("system") || label.includes("architecture")) {
    badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  } else if (label.includes("backend") || label.includes("infra") || label.includes("performance")) {
    badgeColor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
  } else if (label.includes("security") || label.includes("tls") || label.includes("network")) {
    badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/30";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[11px] font-medium border ${badgeColor} ${className}`}
    >
      {children}
    </span>
  );
}






