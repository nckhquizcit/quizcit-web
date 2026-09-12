import { useState } from "react";
import { Link } from "react-router-dom";
import { AtSign } from "lucide-react";
import { useForgotPassword } from "../../../../stores/contexts/ForgotPasswordContext.jsx";
import { forgotPassword } from "../../../../services/authService";
import { getErrorMessage, isRateLimited } from "../../../../services/apiClient";
import { Button, Field, Input } from "../../../../components/ui";
import useCountdown, { isWindowRateLimit } from "../../hooks/useCountdown";
import "../../styles/authShared.css";

// BE gioi han FORGOT_PASSWORD 3 lan / 600s.
const RATE_LIMIT_COOLDOWN_SECONDS = 600;

export default function ForgotPasswordForm({ sessionReset = false }) {
  const { setCurrentState, setEmail, setResetToken, markStepAdvanced } =
    useForgotPassword();
  const [formData, setFormData] = useState({
    email: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, startCooldown] = useCountdown();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (cooldown > 0) return;
    try {
      setLoading(true);
      setError("");
      const res = await forgotPassword(formData.email);
      if (!res?.resetToken) {
        throw new Error("Không nhận được mã xác minh. Vui lòng thử lại.");
      }
      setEmail(res.email);
      setResetToken(res.resetToken);
      markStepAdvanced();
      setCurrentState(2);
    } catch (apiError) {
      if (isRateLimited(apiError) && isWindowRateLimit(apiError)) {
        setError("Bạn đã thử quá nhiều lần. Vui lòng thử lại sau khoảng 10 phút.");
        startCooldown(RATE_LIMIT_COOLDOWN_SECONDS);
      } else {
        // 429 con lai la cooldown gui lai ma 60s cua challenge, khong phai gioi han cua so.
        if (isRateLimited(apiError)) startCooldown();
        setError(getErrorMessage(apiError, "Không thể gửi mã xác minh."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSend}>
      <div className="auth-form__head">
        <h1>Quên mật khẩu</h1>
        <p>Nhập email để nhận mã xác minh.</p>
      </div>

      {sessionReset && (
        <p className="auth-info-box" role="status">
          Phiên đặt lại mật khẩu đã hết hạn, vui lòng bắt đầu lại.
        </p>
      )}

      {error && <div className="auth-form__error" role="alert">{error}</div>}

      <Field label="Email" htmlFor="forgot-email">
        <Input
          id="forgot-email"
          name="email"
          type="email"
          placeholder="Nhập email của bạn"
          value={formData.email}
          onChange={handleChange}
          iconLeft={<AtSign size={18} />}
          autoComplete="email"
          required
        />
      </Field>

      <p className="auth-info-box">
        Mã xác minh có hiệu lực trong thời gian ngắn. Kiểm tra cả thư mục spam.
      </p>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={loading}
        disabled={cooldown > 0}
      >
        {cooldown > 0 ? `Thử lại sau ${cooldown}s` : "Gửi mã xác minh"}
      </Button>

      <p className="auth-form__switch">
        <Link to="/login" className="auth-back-link">
          ← Quay lại đăng nhập
        </Link>
      </p>
    </form>
  );
}
