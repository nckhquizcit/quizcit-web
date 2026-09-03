import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AtSign, Mail } from "lucide-react";
import {
  getErrorMessage,
  isRateLimited,
  saveAuthSession,
} from "../../../../services/apiClient";
import { resendOtp, verifyEmail } from "../../../../services/authService";
import { Button, Field, Input } from "../../../../components/ui";
import useCountdown, { isWindowRateLimit } from "../../hooks/useCountdown";
import "../../styles/authShared.css";
import "./VerifyForm.css";

const DEAD_TOKEN_MESSAGE = "Mã đã hết hiệu lực. Vui lòng bấm Gửi lại mã.";
// BE gioi han RESEND_OTP 3 lan / 600s.
const RATE_LIMIT_COOLDOWN_SECONDS = 600;

export default function VerifyForm({
  email: initialEmail = "",
  verificationToken = "",
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [token, setToken] = useState(verificationToken);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);
  const autoSentRef = useRef(false);

  const trimmedEmail = email.trim();
  const emailValid = trimmedEmail.includes("@");
  const [cooldown, startCooldown] = useCountdown(
    emailValid ? `otp-cooldown:${trimmedEmail.toLowerCase()}` : "",
  );

  useEffect(() => {
    if (initialEmail && initialEmail !== email) {
      setEmail(initialEmail);
    }
  }, [initialEmail, email]);

  useEffect(() => {
    if (verificationToken && verificationToken !== token) {
      setToken(verificationToken);
    }
  }, [verificationToken, token]);

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
      setError(DEAD_TOKEN_MESSAGE);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const auth = await verifyEmail(token, code);
      if (!auth?.accessToken) {
        throw new Error("Xác minh thất bại. Vui lòng thử lại.");
      }
      saveAuthSession(auth);
      navigate("/app");
    } catch (apiError) {
      // 429 (sai qua so lan) va 400 (het han/da dung) deu giet challenge.
      if (apiError?.status === 429 || apiError?.status === 400) {
        setToken("");
        setOtp(new Array(6).fill(""));
        setError(DEAD_TOKEN_MESSAGE);
      } else {
        setError(getErrorMessage(apiError, "Xác minh thất bại."));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (resending || cooldown > 0) return;
    if (!emailValid) {
      setError("Vui lòng nhập email hợp lệ để nhận mã.");
      return;
    }
    try {
      setResending(true);
      setError("");
      const res = await resendOtp(trimmedEmail);
      if (!res?.verificationToken) {
        throw new Error("Không nhận được mã mới. Vui lòng thử lại.");
      }
      setToken(res.verificationToken);
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
  }, [cooldown, emailValid, resending, startCooldown, trimmedEmail]);

  useEffect(() => {
    if (token) {
      inputRefs.current[0]?.focus();
    } else if (emailValid && cooldown === 0 && !autoSentRef.current) {
      autoSentRef.current = true;
      handleResend();
    }
  }, [token, emailValid, cooldown, handleResend]);

  return (
    <form className="auth-form verify-form" onSubmit={handleVerify}>
      <div className="auth-form__head">
        <h1>Xác minh tài khoản</h1>
        <p>
          {token
            ? "Nhập mã 6 số đã gửi tới email."
            : "Bấm Gửi lại mã để nhận mã xác minh 6 số."}
        </p>
      </div>

      {initialEmail ? (
        <div className="auth-email-chip">
          <Mail size={16} />
          <span>{initialEmail}</span>
        </div>
      ) : (
        <Field
          label="Email"
          htmlFor="verify-email"
          error={email && !emailValid ? "Email không hợp lệ." : ""}
        >
          <Input
            id="verify-email"
            name="email"
            type="email"
            placeholder="Nhập email đã đăng ký"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            iconLeft={<AtSign size={18} />}
            autoComplete="email"
            invalid={Boolean(email) && !emailValid}
          />
        </Field>
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

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={loading}
        disabled={!token}
      >
        Xác minh tài khoản
      </Button>

      <div className="auth-resend">
        <span>Không nhận được mã?</span>
        <button
          type="button"
          className="auth-resend__btn"
          onClick={handleResend}
          disabled={resending || cooldown > 0 || !emailValid}
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
