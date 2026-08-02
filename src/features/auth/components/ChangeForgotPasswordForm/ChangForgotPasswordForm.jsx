import { useState } from "react";
import "./ChangeForgotPasswordForm.css";
import { useNavigate } from "react-router-dom";
import { useForgotPassword } from "../../../../stores/contexts/ForgotPasswordContext.jsx";
import { resetPassword } from "../../../../services/authService";
import { getErrorMessage } from "../../../../services/apiClient";
export default function ChangeForgotPasswordForm() {
  const navigate = useNavigate();
  const { confirmedToken } = useForgotPassword();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmNewPassword: "",
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
    if (formData.newPassword !== formData.confirmNewPassword) {
      setError("Mật khẩu xác nhận không khớp.");
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
      localStorage.setItem("accessToken", auth.accessToken);
      localStorage.setItem("user", JSON.stringify(auth));
      navigate("/app");
    } catch (apiError) {
      setError(getErrorMessage(apiError, "Đặt lại mật khẩu thất bại."));
    } finally {
      setLoading(false);
    }
  };
  return (
    <form className="forgot-password-form-container" onSubmit={handleSend}>
      <h1>Đặt mật khẩu mới</h1>
      <p className="text-gray-500">Tạo mật khẩu mới cho tài khoản của bạn</p>

      {error && <div className="auth-form__error">{error}</div>}

      <div className="input-container">
        <label htmlFor="newPassword">Mật khẩu mới</label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          placeholder="Nhập mật khẩu mới của bạn"
          value={formData.newPassword}
          onChange={handleChange}
          required
        />
      </div>
      <div className="input-container">
        <label htmlFor="confirmNewPassword">Mật khẩu mới</label>
        <input
          id="confirmNewPassword"
          name="confirmNewPassword"
          type="password"
          placeholder="Xác nhận mật khẩu mới của bạn"
          value={formData.confirmNewPassword}
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit" className="send-button" disabled={loading}>
        {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
      </button>
    </form>
  );
}
