import { ChevronRight } from "lucide-react";
import { Card } from "../../../../components/ui";
import { formatScaledThetaValue } from "../../../../services/mappers";
import "./HistoryCard.css";

export default function HistoryCard({
  title,
  subjectName,
  date,
  score,
  totalQuestions,
  estimatedAbility,
  percentage,
  onViewDetail,
}) {
  // Bài không có câu hỏi (tổng số câu <= 0) là thiếu dữ liệu, không phải làm kém:
  // không được rơi vào bậc màu đỏ của thang điểm.
  const hasQuestions = Number(totalQuestions) > 0;
  const scoreTier = !hasQuestions
    ? "neutral"
    : percentage >= 80
      ? "good"
      : percentage >= 60
        ? "fair"
        : "low";

  // Một nhãn mô tả duy nhất cho cả nút; phần bên trong chỉ để hiển thị nên ẩn khỏi
  // trình đọc màn hình để tránh đọc lặp.
  const cardLabel = hasQuestions
    ? `${title}, ${subjectName}, ${percentage}%, ${score} trên ${totalQuestions} câu, năng lực ${formatScaledThetaValue(estimatedAbility)} trên 4, làm lúc ${date}`
    : `${title}, ${subjectName}, chưa có dữ liệu câu hỏi, năng lực ${formatScaledThetaValue(estimatedAbility)} trên 4, làm lúc ${date}`;

  return (
    <Card
      as="button"
      type="button"
      interactive
      padding="none"
      className="history-row"
      onClick={onViewDetail}
      aria-label={cardLabel}
    >
      <span
        className={`history-row__badge history-row__badge--${scoreTier}`}
        aria-hidden="true"
      >
        {hasQuestions ? `${percentage}%` : "—"}
      </span>

      <span className="history-row__main" aria-hidden="true">
        <span className="history-row__name">{title}</span>
        <span className="history-row__meta">
          {hasQuestions ? `${subjectName} · ${score}/${totalQuestions} câu` : `${subjectName} · Chưa có dữ liệu câu hỏi`}
        </span>
      </span>

      <span className="history-row__side" aria-hidden="true">
        <span className="history-row__theta" title="Năng lực">
          θ {formatScaledThetaValue(estimatedAbility)} / 4
        </span>
        <span className="history-row__date">{date}</span>
        <ChevronRight size={18} className="history-row__chevron" />
      </span>
    </Card>
  );
}
