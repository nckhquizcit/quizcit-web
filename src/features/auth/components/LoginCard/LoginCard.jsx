import "../../styles/authShared.css";
import "./LoginCard.css";

export default function LoginCard() {
  return (
    <div className="auth-brand-panel">
      <div className="auth-brand-panel__brand">
        <span className="auth-brand-panel__mark">Q</span>
        <span className="auth-brand-panel__brand-name">QuizCIT</span>
      </div>
      <h1>Học đúng phần cần học.</h1>
      <p>
        Luyện thích ứng theo năng lực. Thi có giới hạn thời gian. Kết quả và
        theta theo kỹ năng.
      </p>
      <p className="auth-brand-panel__footnote">
        Học có định hướng · Tiến bộ có bằng chứng
      </p>
    </div>
  );
}
