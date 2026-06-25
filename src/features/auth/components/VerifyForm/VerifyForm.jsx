import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Info, Mail } from "lucide-react";
import { Button } from "../../../../components/ui";
import "./VerifyForm.css";

export default function VerifyForm({ email = "" }) {
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
    // Backend verification API chưa sẵn sàng — màn hình demo.
  };

  return (
    <form className="auth-form verify-form" onSubmit={handleVerify}>
      <div className="auth-form__head">
        <h1>Xác minh tài khoản</h1>
        <p>Nhập mã 6 số được gửi đến email của bạn</p>
      </div>

      {email && (
        <div className="verify-email">
          <Mail size={16} />
          <span>{email}</span>
        </div>
      )}

      <div className="verify-otp">
        {otp.map((data, index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            maxLength="1"
            ref={(el) => (inputRefs.current[index] = el)}
            value={data}
            onChange={(e) => handleChange(e.target, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          />
        ))}
      </div>

      <div className="auth-notice">
        <Info size={15} />
        <span>Chức năng xác minh đang được phát triển.</span>
      </div>

      <Button type="submit" variant="primary" fullWidth>
        Xác minh tài khoản
      </Button>

      <div className="verify-resend">
        <span>Không nhận được mã?</span>
        <button type="button" className="verify-resend__btn">
          Gửi lại mã
        </button>
      </div>

      <p className="auth-form__switch">
        <Link to="/login" className="auth-back-link">
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </Link>
      </p>
    </form>
  );
}
