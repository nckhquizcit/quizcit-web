import "./VerifyForgotPasswordForm.css";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Mail, Info, ArrowLeft } from "lucide-react";
import { useForgotPassword } from "../../../../stores/contexts/ForgotPasswordContext.jsx";

export default function VerifyForgotPasswordForm({
  email = "nhhun@example.com",
}) {
  const { setCurrentState } = useForgotPassword();
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && index > 0 && otp[index] === "") {
      inputRefs.current[index - 1].focus();
    }
  };
  const handleVerify = (e) => {
    e.preventDefault();

    const verificationCode = otp.join("");

    if (verificationCode.length < 6) {
      alert("Vui lòng nhập đủ 6 số!");
      return;
    }

    // Backend forgot-password verification API is not available yet.
    // Đây là nơi bạn gọi API từ service của QuizCIT
    setCurrentState(3);
  };
  return (
    <form className="verify-form-container" onSubmit={handleVerify}>
      <h2 className="form-title">Nhập mã xác minh</h2>
      <p className="form-subtitle">Mã xác minh đã được gửi đến</p>

      <div className="email-display">
        <Mail size={18} />
        <span>{email}</span>
      </div>

      <div className="otp-section">
        <p>Nhập 6 số mã xác minh</p>
        <div className="otp-inputs">
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              maxLength="1"
              ref={(el) => (inputRefs.current[index] = el)}
              value={data}
              onChange={(e) => handleChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            />
          ))}
        </div>
      </div>

      <button type="submit" className="submit-btn">
        Xác minh
      </button>

      <div className="resend-group">
        <span>Không nhận được mã?</span>
        <button type="button" className="resend-btn">
          Gửi lại mã
        </button>
      </div>
    </form>
  );
}
