import { useState } from "react";
import "./ForgotPasswordForm.css";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useForgotPassword } from "../../../../stores/contexts/ForgotPasswordContext.jsx";
import { forgotPassword } from "../../../../services/authService";
import { getErrorMessage } from "../../../../services/apiClient";
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
    <form className="forgot-password-form-container" onSubmit={handleSend}>
      <h1>Quên mật khẩu</h1>
      <p className="text-gray-500">Nhập email để nhận mã xác minh</p>

      {error && <div className="auth-form__error">{error}</div>}

      <div className="input-container">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Nhập email của bạn"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <button type="submit" className="send-button" disabled={loading}>
        {loading ? "Đang gửi..." : "Gửi mã xác minh"}
      </button>

      <div className="form-footer">
        <Link to="/login" className="back-link">
          <ArrowLeft size={18} />
          <span>Quay lại đăng nhập</span>
        </Link>
      </div>
    </form>
  );
}
