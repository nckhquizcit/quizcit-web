import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../../../services/authService";
import "./LoginForm.css";

export default function LoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const auth = await login(formData.username, formData.password);
      localStorage.setItem("accessToken", auth.accessToken);
      localStorage.setItem("user", JSON.stringify(auth));
      navigate(auth.role === "ADMINISTRATOR" ? "/admin" : "/app");
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="login-form-container" onSubmit={handleLogin}>
      <h1>Đăng nhập</h1>
      <p className="text-gray-500">Nhập thông tin đăng nhập để tiếp tục</p>
      {error && <p className="text-red-500">{error}</p>}

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
      <div className="forgot-password-section">
        <p>
          <Link to="/forgot-password">Quên mật khẩu?</Link>
        </p>
      </div>

      <button type="submit" className="login-button" disabled={loading}>
        {loading ? "Đang xử lý..." : "Đăng nhập"}
      </button>

      <div className="register-section">
        <p>
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </div>
    </form>
  );
}
