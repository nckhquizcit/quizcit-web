import { Lock } from "lucide-react";
import "./AchievementCard.css";

export default function AchievementCard({
  title,
  description,
  icon,
  progress,
  total,
  rank,
  isLocked,
  isActive,
}) {
  const percent = Math.min((progress / total) * 100, 100);
  const DisplayIcon = icon || Lock;

  return (
    <div
      className={`achievement-card ${isLocked ? "locked" : ""} ${isActive ? "active" : ""}`}
    >
      <div className="achievement-icon-wrapper">
        <div className="achievement-icon-circle">
          <DisplayIcon size={36} strokeWidth={1.5} className="lucide-icon" />
        </div>

        {isLocked && (
          <div className="lock-badge">
            <Lock size={12} />
          </div>
        )}
      </div>

      <h4 className="achievement-title">{title}</h4>
      <p className="achievement-desc">{description}</p>

      <div className="achievement-progress-container">
        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
        <div className="progress-text">
          {progress}/{total}
        </div>
      </div>

      {rank && (
        <div className={`achievement-rank rank-${rank.toLowerCase()}`}>
          {rank}
        </div>
      )}
    </div>
  );
}
