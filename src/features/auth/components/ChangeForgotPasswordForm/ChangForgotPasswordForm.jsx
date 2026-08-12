import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useForgotPassword } from "../../../../stores/contexts/ForgotPasswordContext.jsx";
import { resetPassword } from "../../../../services/authService";
import { getErrorMessage, setStoredUser } from "../../../../services/apiClient";
import { Button, Field, Input } from "../../../../components/ui";
import "../../styles/authShared.css";

export default function ChangeForgotPasswordForm() {
  const navigate = useNavigate();
  const { confirmedToken } = useForgotPassword();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSend = async (e) => {
    e.preventDefault();
    setConfirmError("");
    if (formData.newPassword !== formData.confirmNewPassword) {
      setConfirmError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!confirmedToken) {
      setError("Phiên đặt lại mật khẩu đã hết hạn. Vui lòng thử lại.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const auth = await resetPassword(confirmedToken, formData.newPassword);
      if (!auth?.accessToken) {
        throw new Error("Đặt lại mật khẩu thất bại. Vui lòng thử lại.");
      }
      localStorage.setItem("accessToken", auth.accessToken);
      setStoredUser(auth);
      navigate("/app");
    } catch (apiError) {
      setError(getErrorMessage(apiError, "Đặt lại mật khẩu thất bại."));
    } finally {
      setLoading(false);
    }
  };
  return (
    <form className="auth-form" onSubmit={handleSend}>
      <div className="auth-form__head">
        <h1>Tạo mật khẩu mới</h1>
        <p>Mật khẩu tối thiểu 6 ký tự.</p>
      </div>

      {error && <div className="auth-form__error">{error}</div>}

      <Field label="Mật khẩu mới" htmlFor="new-password">
        <div className="auth-form__pwd">
          <Input
            id="new-password"
            name="newPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu mới của bạn"
            value={formData.newPassword}
            onChange={handleChange}
            iconLeft={<LockKeyhole size={18} />}
            autoComplete="new-password"
            minLength={6}
            required
          />
          <button
            type="button"
            className="auth-form__pwd-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </Field>
      <Field
        label="Nhập lại mật khẩu"
        htmlFor="confirm-new-password"
        error={confirmError}
      >
        <div className="auth-form__pwd">
          <Input
            id="confirm-new-password"
            name="confirmNewPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Xác nhận mật khẩu mới của bạn"
            value={formData.confirmNewPassword}
            onChange={handleChange}
            iconLeft={<LockKeyhole size={18} />}
            autoComplete="new-password"
            invalid={Boolean(confirmError)}
            minLength={6}
            required
          />
          <button
            type="button"
            className="auth-form__pwd-toggle"
            onClick={() => setShowConfirmPassword((v) => !v)}
            aria-label={
              showConfirmPassword
                ? "Ẩn mật khẩu nhập lại"
                : "Hiện mật khẩu nhập lại"
            }
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </Field>

      <p className="auth-info-box">
        Không dùng lại mật khẩu cũ. Bạn sẽ được đăng nhập ngay sau khi đổi mật
        khẩu.
      </p>

      <Button type="submit" variant="primary" fullWidth loading={loading}>
        Đổi mật khẩu
      </Button>

      <p className="auth-form__switch">
        <Link to="/login" className="auth-back-link">
          ← Quay lại đăng nhập
        </Link>
      </p>
    </form>
  );
}
