import { useState } from "react";
import "./ForgotPasswordForm.css";
import { Link } from "react-router-dom";
import { Mail, Info, ArrowLeft } from "lucide-react";
import { useForgotPassword } from "../../../../stores/contexts/ForgotPasswordContext.jsx";
export default function ForgotPasswordForm() {
  const { setCurrentState } = useForgotPassword();
  const [formData, setFormData] = useState({
    email: "",
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
    // Logic gọi API đăng ký ở đây
    console.log("Dữ liệu quên mật khẩu:", formData);
    setCurrentState(2);
  };
  return (
    <form className="forgot-password-form-container" onSubmit={handleSend}>
      <h1>Quên mật khẩu</h1>
      <p className="text-gray-500">Nhập email để nhận mã xác minh</p>

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

      <button type="submit" className="send-button">
        Gửi mã xác minh
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
