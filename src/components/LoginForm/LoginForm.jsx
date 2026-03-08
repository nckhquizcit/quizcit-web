import { useState } from "react";
import { Link } from "react-router-dom"; // Import Link để điều hướng SPA
import "./LoginForm.css";

export default function LoginForm() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Logic gọi API đăng nhập (ví dụ: axios.post('/api/login', formData))
    console.log("Dữ liệu đăng nhập:", formData);
  };

  return (
    <form className="login-form-container" onSubmit={handleLogin}>
      <h1>Đăng nhập</h1>
      <p className="text-gray-500">Nhập thông tin đăng nhập để tiếp tục</p>

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

      <div className="remember-container">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            name="remember"
            type="checkbox"
            checked={formData.remember}
            onChange={handleChange}
          />
          <span>Ghi nhớ tôi</span>
        </label>
      </div>

      <button type="submit" className="login-button">
        Đăng nhập
      </button>

      <div className="register-section">
        <p>
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </div>
    </form>
  );
}
