import './ProgressBar.css';

export default function ProgressBar({ value }) {
  const safeValue = Math.max(0, Math.min(100, value || 0));

  return (
    <div
      className="progress-bar-track"
      role="progressbar"
      aria-label={`Tiến độ ${safeValue}%`}
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="progress-bar-fill" style={{ width: `${safeValue}%` }} />
    </div>
  );
}
