import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { getErrorMessage, setStoredUser } from "../../../../services/apiClient";
import { resendOtp, verifyEmail } from "../../../../services/authService";
import { Button } from "../../../../components/ui";
import "../../styles/authShared.css";
import "./VerifyForm.css";

export default function VerifyForm({ email = "", verificationToken = "" }) {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [token, setToken] = useState(verificationToken);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

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

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Vui lòng nhập đủ 6 số.");
      return;
    }
    if (!token) {
      setError("Phiên xác minh đã hết hạn. Vui lòng đăng ký lại.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const auth = await verifyEmail(token, code);
      if (!auth?.accessToken) {
        throw new Error("Xác minh thất bại. Vui lòng thử lại.");
      }
      localStorage.setItem("accessToken", auth.accessToken);
      setStoredUser(auth);
      navigate("/app");
    } catch (apiError) {
      setError(getErrorMessage(apiError, "Xác minh thất bại."));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    try {
      setResending(true);
      setError("");
      const res = await resendOtp(email);
      if (!res?.verificationToken) {
        throw new Error("Không nhận được mã mới. Vui lòng thử lại.");
      }
      setToken(res.verificationToken);
      setOtp(new Array(6).fill(""));
      setCooldown(60);
    } catch (apiError) {
      setError(getErrorMessage(apiError, "Không thể gửi lại mã."));
    } finally {
      setResending(false);
    }
  };

  return (
    <form className="auth-form verify-form" onSubmit={handleVerify}>
      <div className="auth-form__head">
        <h1>Xác minh tài khoản</h1>
        <p>Nhập mã 6 số đã gửi tới email.</p>
      </div>

      {email && (
        <div className="auth-email-chip">
          <Mail size={16} />
          <span>{email}</span>
        </div>
      )}

      {error && <div className="auth-form__error">{error}</div>}

      <div className="auth-otp" role="group" aria-label="Mã xác minh 6 số">
        {otp.map((data, index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            maxLength="1"
            autoComplete="one-time-code"
            aria-label={`Số thứ ${index + 1}`}
            ref={(el) => (inputRefs.current[index] = el)}
            value={data}
            onChange={(e) => handleChange(e.target, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          />
        ))}
      </div>

      <Button type="submit" variant="primary" fullWidth loading={loading}>
        Xác minh tài khoản
      </Button>

      <div className="auth-resend">
        <span>Không nhận được mã?</span>
        <button
          type="button"
          className="auth-resend__btn"
          onClick={handleResend}
          disabled={resending || cooldown > 0 || !email}
        >
          {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại mã"}
        </button>
      </div>

      <p className="auth-form__switch">
        <Link to="/login" className="auth-back-link">
          ← Quay lại đăng nhập
        </Link>
      </p>
    </form>
  );
}
