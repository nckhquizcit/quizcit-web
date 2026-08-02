import { CheckCircle2 } from "lucide-react";
import "./VerifyCard.css";

export default function VerifyCard() {
  return (
    <div className="auth-brand-panel">
      <span className="auth-brand-panel__mark">Q</span>
      <h1>Xác minh tài khoản</h1>
      <p>Vui lòng xác minh tài khoản trước khi sử dụng QuizCIT.</p>
      <div className="auth-brand-panel__features">
        <div className="auth-brand-panel__feature">
          <span>
            <CheckCircle2 size={16} />
          </span>
          Mã xác minh đã gửi đến email của bạn
        </div>
        <div className="auth-brand-panel__feature">
          <span>
            <CheckCircle2 size={16} />
          </span>
          Kiểm tra hộp thư spam nếu không thấy email
        </div>
        <div className="auth-brand-panel__feature">
          <span>
            <CheckCircle2 size={16} />
          </span>
          Mỗi mã có hiệu lực trong 15 phút
        </div>
      </div>
    </div>
  );
}
