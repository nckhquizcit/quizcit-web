import "./ProgressRing.css";

export default function ProgressRing({
  value = 0,
  size = 120,
  stroke = 10,
  label = null,
  sublabel = null,
  color = "var(--color-primary)",
  trackColor = "var(--color-surface-3)",
  className = "",
}) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;

  return (
    <div
      className={`ui-ring ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(safe)}%`}
    >
      <svg width={size} height={size} className="ui-ring__svg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="ui-ring__bar"
        />
      </svg>
      <div className="ui-ring__center">
        <span className="ui-ring__label">
          {label ?? `${Math.round(safe)}%`}
        </span>
        {sublabel && <span className="ui-ring__sub">{sublabel}</span>}
      </div>
    </div>
  );
}
