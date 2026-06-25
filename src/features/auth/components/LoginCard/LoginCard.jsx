import { BookOpen, Brain, TrendingUp } from "lucide-react";
import "./LoginCard.css";

export default function LoginCard() {
  return (
    <div className="auth-brand-panel">
      <span className="auth-brand-panel__mark">Q</span>
      <h1>QuizCIT</h1>
      <p>Hệ thống ôn tập trắc nghiệm trực tuyến thông minh.</p>
      <div className="auth-brand-panel__features">
        <div className="auth-brand-panel__feature">
          <span>
            <BookOpen size={16} />
          </span>
          Lý thuyết và quiz theo từng chương
        </div>
        <div className="auth-brand-panel__feature">
          <span>
            <Brain size={16} />
          </span>
          Đo năng lực theo kỹ năng
        </div>
        <div className="auth-brand-panel__feature">
          <span>
            <TrendingUp size={16} />
          </span>
          Theo dõi tiến độ sau mỗi bài làm
        </div>
      </div>
    </div>
  );
}
