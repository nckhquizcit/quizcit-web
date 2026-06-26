import { Calendar, FileText, TrendingUp } from "lucide-react";
import { Badge, Button, Card } from "../../../../components/ui";
import "./HistoryCard.css";

export default function HistoryCard({
  title,
  subjectName,
  date,
  questionCount,
  score,
  totalQuestions,
  estimatedAbility,
  percentage,
  onViewDetail,
}) {
  const badgeVariant =
    percentage >= 80 ? "success" : percentage >= 60 ? "info" : "warning";

  return (
    <Card padding="lg" className="history-item-card">
      <div className="history-item-header">
        <h3 className="history-item-title">{title}</h3>
        <Badge variant={badgeVariant}>{percentage}%</Badge>
      </div>

      <div className="history-item-meta">
        <div className="meta-info">
          <Calendar size={14} />
          <span>{date}</span>
        </div>
        <div className="meta-info">
          <FileText size={14} />
          <span>{subjectName}</span>
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
            <span className="stat-value">
              {score}/{totalQuestions}
            </span>
          </div>
          <div className="stat-box">
            <div className="stat-label-with-icon">
              <TrendingUp size={14} />
              <span className="stat-label">Năng lực ước tính</span>
            </div>
            <span className="stat-value">
              {Number(estimatedAbility || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <Button variant="secondary" size="sm" onClick={onViewDetail}>
          Xem chi tiết
        </Button>
      </div>
    </Card>
  );
}
