import "../../styles/authShared.css";
import "./LoginCard.css";

export default function LoginCard() {
  return (
    <div className="auth-brand-panel">
      <div className="auth-brand-panel__brand">
        <span className="auth-brand-panel__mark">Q</span>
        <span className="auth-brand-panel__brand-name">QuizCIT</span>
      </div>
      <h1>Hệ thống ôn tập trực tuyến</h1>
      <p>Luyện tập thích ứng dựa trên năng lực của bạn</p>
    </div>
  );
}
