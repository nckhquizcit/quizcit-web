import React from "react";
import "./AchievementCard.css";
import { Lock } from "lucide-react";

export default function AchievementCard({
  title,
  description,
  icon, // Component Icon từ Lucide (Target, Trophy, etc.)
  progress,
  total,
  rank,
  isLocked, // Trạng thái khóa (màu xám, grayscale)
  isActive, // Trạng thái đã đạt được (màu sinh động, highlight viền)
}) {
  // Tính tỷ lệ phần trăm hoàn thành, tối đa 100%
  const percent = Math.min((progress / total) * 100, 100);
  const DisplayIcon = icon || Lock;

  return (
    <div
      className={`achievement-card ${isLocked ? "locked" : ""} ${isActive ? "active" : ""}`}
    >
      {/* Container của Icon */}
      <div className="achievement-icon-wrapper">
        <div className="achievement-icon-circle">
          {/* Icon Lucide: Sẽ được CSS tô màu khi có class .active */}
          <DisplayIcon size={40} strokeWidth={1.5} className="lucide-icon" />
        </div>

        {/* Badge ổ khóa (chỉ hiện khi bị khóa) */}
        {isLocked && (
          <div className="lock-badge">
            <Lock size={12} />
          </div>
        )}
      </div>

      {/* Nội dung thành tích */}
      <h4 className="achievement-title">{title}</h4>
      <p className="achievement-desc">{description}</p>

      {/* Thanh tiến trình */}
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

      {/* Hạng thành tích (Vàng, Bạc, Đồng) */}
      {rank && (
        <div className={`achievement-rank rank-${rank.toLowerCase()}`}>
          {rank}
        </div>
      )}
    </div>
  );
}
