import { useState } from "react";
import "./RegisterForm.css";
import { Link } from "react-router-dom";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Mật khẩu nhập lại không khớp!");
      return;
    }
    // Logic gọi API đăng ký ở đây
    console.log("Dữ liệu đăng ký:", formData);
  };

  return (
    <form className="register-form-container" onSubmit={handleRegister}>
      <h1>Đăng ký</h1>
      <p className="text-gray-500">Tạo tài khoản mới để bắt đầu ôn tập</p>

      <div className="input-container">
        <label htmlFor="username">Tên đăng nhập</label>
        <input
          id="username"
          name="username"
          type="text"
          placeholder="Nhập tên đăng nhập"
          value={formData.username}
          onChange={handleChange}
          required
        />
      </div>

      <div className="input-container">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="example@gmail.com"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="input-container">
        <label htmlFor="password">Mật khẩu</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Nhập mật khẩu"
          value={formData.password}
          onChange={handleChange}
          required
        />
      </div>

      <div className="input-container">
        <label htmlFor="confirmPassword">Nhập lại mật khẩu</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Xác nhận lại mật khẩu"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
      </div>

      <button type="submit" className="register-button">
        Đăng ký
      </button>

      <div className="login-section">
        <p>
          Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
        </p>
      </div>
    </form>
  );
}
