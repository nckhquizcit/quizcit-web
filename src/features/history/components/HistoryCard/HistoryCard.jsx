import React from "react";
import "./HistoryCard.css";
import { Calendar, FileText, TrendingUp } from "lucide-react";

export default function HistoryCard({
  title,
  date,
  questionCount,
  score,
  totalQuestions,
  powerIndex,
  percentage,
}) {
  return (
    <div className="history-item-card">
      <div className="history-item-header">
        <h3 className="history-item-title">{title}</h3>
        <span className="history-percentage-badge">{percentage}%</span>
      </div>

      <div className="history-item-meta">
        <div className="meta-info">
          <Calendar size={14} />
          <span>{date}</span>
        </div>
        <div className="meta-info">
          <FileText size={14} />
          <span>{questionCount} câu hỏi</span>
        </div>
      </div>

      <div className="history-item-stats-container">
        <div className="stats-group">
          <div className="stat-box">
            <span className="stat-label">Điểm số</span>
            <span className="stat-value text-green">
              {score}/{totalQuestions}
            </span>
          </div>
          <div className="stat-box">
            <div className="stat-label-with-icon">
              <TrendingUp size={14} />
              <span className="stat-label">Chỉ số năng lực</span>
            </div>
            <span className="stat-value text-green">{powerIndex}</span>
          </div>
        </div>

        <button className="view-detail-btn">Xem chi tiết</button>
      </div>
    </div>
  );
}
