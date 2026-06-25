import "./Spinner.css";

export default function Spinner({ size = 24, className = "", label = "Đang tải" }) {
  return (
    <span
      className={`ui-spinner ${className}`}
      style={{ width: size, height: size, borderWidth: Math.max(2, size / 10) }}
      role="status"
      aria-label={label}
    />
  );
}
