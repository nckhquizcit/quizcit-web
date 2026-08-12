import { useState } from "react";
import { Link } from "react-router-dom";
import { AtSign } from "lucide-react";
import { useForgotPassword } from "../../../../stores/contexts/ForgotPasswordContext.jsx";
import { forgotPassword } from "../../../../services/authService";
import { getErrorMessage } from "../../../../services/apiClient";
import { Button, Field, Input } from "../../../../components/ui";
import "../../styles/authShared.css";

export default function ForgotPasswordForm() {
  const { setCurrentState, setEmail, setResetToken } = useForgotPassword();
  const [formData, setFormData] = useState({
    email: "",
  });
  const [error, setError] = useState("");
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
    try {
      setLoading(true);
      setError("");
      const res = await forgotPassword(formData.email);
      if (!res?.resetToken) {
        throw new Error("Không nhận được mã xác minh. Vui lòng thử lại.");
      }
      setEmail(res.email);
      setResetToken(res.resetToken);
      setCurrentState(2);
    } catch (apiError) {
      setError(getErrorMessage(apiError, "Không thể gửi mã xác minh."));
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

      {error && <div className="auth-form__error">{error}</div>}

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

      <Button type="submit" variant="primary" fullWidth loading={loading}>
        Gửi mã xác minh
      </Button>

      <p className="auth-form__switch">
        <Link to="/login" className="auth-back-link">
          ← Quay lại đăng nhập
        </Link>
      </p>
    </form>
  );
}
