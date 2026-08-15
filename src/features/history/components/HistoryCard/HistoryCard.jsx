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
  const scoreTier = percentage >= 80 ? "good" : percentage >= 60 ? "fair" : "low";

  return (
    <Card
      as="button"
      type="button"
      interactive
      padding="none"
      className="history-row"
      onClick={onViewDetail}
    >
      <span className={`history-row__badge history-row__badge--${scoreTier}`}>
        {percentage}%
      </span>

      <span className="history-row__main">
        <span className="history-row__name">{title}</span>
        <span className="history-row__meta">
          {subjectName} · {score}/{totalQuestions} câu
        </span>
      </span>

      <span className="history-row__side">
        <span
          className="history-row__theta"
          title="Năng lực"
          aria-label={`Năng lực ${formatScaledThetaValue(estimatedAbility)} trên 4`}
        >
          θ {formatScaledThetaValue(estimatedAbility)} / 4
        </span>
        <span className="history-row__date">{date}</span>
        <ChevronRight size={18} className="history-row__chevron" />
      </span>
    </Card>
  );
}
