import './ProgressBar.css';

export default function ProgressBar({ value }) {
  const safeValue = Math.max(0, Math.min(100, value || 0));

  return (
    <div className="progress-bar-track" aria-label={`Tiến độ ${safeValue}%`}>
      <div className="progress-bar-fill" style={{ width: `${safeValue}%` }} />
    </div>
  );
}
