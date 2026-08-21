import './ProgressBar.css';
import { getProgressTone } from "./progressTone.js";

export default function ProgressBar({ value, tone }) {
  const safeValue = Math.max(0, Math.min(100, value || 0));
  const resolvedTone = tone || getProgressTone(safeValue);

  return (
    <div
      className="progress-bar-track"
      role="progressbar"
      aria-label={`Tiến độ ${safeValue}%`}
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`progress-bar-fill progress-bar-fill--${resolvedTone}`}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
