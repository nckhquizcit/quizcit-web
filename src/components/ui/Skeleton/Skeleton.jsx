import "./Skeleton.css";

export default function Skeleton({
  width = "100%",
  height = 16,
  radius = "var(--radius-sm)",
  className = "",
  style = {},
}) {
  return (
    <span
      className={`ui-skeleton ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ lines = 3, className = "" }) {
  return (
    <div className={`ui-skeleton-card ${className}`}>
      <Skeleton height={20} width="55%" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? "70%" : "100%"} />
      ))}
    </div>
  );
}
