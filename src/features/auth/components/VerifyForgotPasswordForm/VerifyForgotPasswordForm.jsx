import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useForgotPassword } from "../../../../stores/contexts/ForgotPasswordContext.jsx";
import { forgotPassword, verifyResetOtp } from "../../../../services/authService";
import { getErrorMessage, isRateLimited } from "../../../../services/apiClient";
import { Button } from "../../../../components/ui";
import useCountdown, { isWindowRateLimit } from "../../hooks/useCountdown";
import "../../styles/authShared.css";

const DEAD_TOKEN_MESSAGE = "Mã đã hết hiệu lực. Vui lòng bấm Gửi lại mã.";
// BE gioi han FORGOT_PASSWORD 3 lan / 600s.
const RATE_LIMIT_COOLDOWN_SECONDS = 600;

export default function VerifyForgotPasswordForm() {
  const {
    email,
    resetToken,
    setResetToken,
    setConfirmedToken,
    setCurrentState,
    clearSessionReset,
  } = useForgotPassword();
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);
  const composingOtpRef = useRef(false);

  const trimmedEmail = (email || "").trim();
  const [cooldown, startCooldown] = useCountdown(
    trimmedEmail ? `otp-cooldown:reset:${trimmedEmail.toLowerCase()}` : "",
  );

  const handleChange = (event, index, isCompositionEnd = false) => {
    if (!isCompositionEnd && (composingOtpRef.current || event.nativeEvent.isComposing)) return;
    const { value } = event.target;
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Dan ma 6 so tu email: do lan luot tu o dang dan, bo ky tu khong phai chu so.
  const handlePaste = (e) => {
    const digits = (e.clipboardData.getData("text") || "")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!digits) return;
    e.preventDefault();
    const newOtp = new Array(6).fill("");
    digits.split("").forEach((digit, offset) => {
      newOtp[offset] = digit;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && index > 0 && otp[index] === "") {
      inputRefs.current[index - 1].focus();
    }
  };
  const handleVerify = async (e) => {
    e.preventDefault();
    const verificationCode = otp.join("");
    if (verificationCode.length < 6) {
      setError("Vui lòng nhập đủ 6 số.");
      return;
    }
    if (!resetToken) {
      setError(DEAD_TOKEN_MESSAGE);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await verifyResetOtp(resetToken, verificationCode);
      if (!res?.confirmedToken) {
        throw new Error("Xác minh thất bại. Vui lòng thử lại.");
      }
      setConfirmedToken(res.confirmedToken);
      setCurrentState(3);
    } catch (apiError) {
      // 429 (sai qua so lan) va 400 (het han/da dung) deu giet challenge.
      if (apiError?.status === 429 || apiError?.status === 400) {
        setResetToken("");
        setOtp(new Array(6).fill(""));
        setError(DEAD_TOKEN_MESSAGE);
      } else if (apiError?.status === 401) {
        // 401 la nhap sai ma nhung challenge con song: giu token, chi xoa OTP de nhap lai.
        setOtp(new Array(6).fill(""));
        setError(getErrorMessage(apiError, "Xác minh thất bại."));
        inputRefs.current[0]?.focus();
      } else {
        setError(getErrorMessage(apiError, "Xác minh thất bại."));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!trimmedEmail || resending || cooldown > 0) return;
    try {
      setResending(true);
      setError("");
      const res = await forgotPassword(trimmedEmail);
      if (!res?.resetToken) {
        throw new Error("Không nhận được mã mới. Vui lòng thử lại.");
      }
      setResetToken(res.resetToken);
      setOtp(new Array(6).fill(""));
      startCooldown();
      inputRefs.current[0]?.focus();
    } catch (apiError) {
      if (isRateLimited(apiError) && isWindowRateLimit(apiError)) {
        startCooldown(RATE_LIMIT_COOLDOWN_SECONDS);
        setError("Bạn đã thử quá nhiều lần. Vui lòng thử lại sau khoảng 10 phút.");
      } else {
        // 429 con lai la cooldown gui lai ma 60s cua challenge, khong phai gioi han cua so.
        if (isRateLimited(apiError)) startCooldown();
        setError(getErrorMessage(apiError, "Không thể gửi lại mã."));
      }
    } finally {
      setResending(false);
    }
  };
  return (
    <form className="auth-form" onSubmit={handleVerify}>
      <div className="auth-form__head">
        <h1>Xác minh email</h1>
        <p>
          {resetToken
            ? "Nhập mã 6 số để đặt lại mật khẩu."
            : "Bấm Gửi lại mã để nhận mã xác minh mới."}
        </p>
      </div>

      {email && (
        <div className="auth-email-chip">
          <Mail size={16} />
          <span>{email}</span>
        </div>
      )}

      {error && <div className="auth-form__error" role="alert">{error}</div>}

      <div className="auth-otp" role="group" aria-label="Mã xác minh 6 số" onPaste={handlePaste}>
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
            onCompositionStart={() => { composingOtpRef.current = true; }}
            onCompositionEnd={(e) => {
              composingOtpRef.current = false;
              handleChange(e, index, true);
            }}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          />
        ))}
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={loading}
        disabled={!resetToken}
      >
        Xác nhận mã
      </Button>

      <div className="auth-resend">
        <span>Không nhận được mã?</span>
        <button
          type="button"
          className="auth-resend__btn"
          onClick={handleResend}
          disabled={resending || cooldown > 0 || !trimmedEmail}
        >
          {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại mã"}
        </button>
      </div>

      <p className="auth-form__switch">
        <button
          type="button"
          className="auth-resend__btn"
          onClick={() => {
            clearSessionReset();
            setCurrentState(1);
          }}
        >
          Đổi email khác
        </button>
      </p>

      <p className="auth-form__switch">
        <Link to="/login" className="auth-back-link">
          ← Quay lại đăng nhập
        </Link>
      </p>
    </form>
  );
}
