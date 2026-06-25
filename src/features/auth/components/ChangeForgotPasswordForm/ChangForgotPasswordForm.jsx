import { useState } from "react";
import "./ChangeForgotPasswordForm.css";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Mail, Info, ArrowLeft } from "lucide-react";
export default function ChangeForgotPasswordForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmNewPassword: "",
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSend = (e) => {
    e.preventDefault();
    // Backend reset-password API is not available yet; keep the placeholder flow.
    navigate("/login", { replace: true });
  };
  return (
    <form className="forgot-password-form-container" onSubmit={handleSend}>
      <h1>Đặt mật khẩu mới</h1>
      <p className="text-gray-500">Tạo mật khẩu mới cho tài khoản của bạn</p>

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
      <button type="submit" className="send-button">
        Đặt lại mật khẩu
      </button>
    </form>
  );
}
