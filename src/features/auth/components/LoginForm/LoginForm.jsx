import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, User } from "lucide-react";
import { getErrorMessage } from "../../../../services/apiClient";
import { login } from "../../../../services/authService";
import { Button, Field, Input } from "../../../../components/ui";
import "./LoginForm.css";

export default function LoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
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
      setError(getErrorMessage(apiError, "Đăng nhập thất bại."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleLogin}>
      <div className="auth-form__head">
        <h1>Đăng nhập</h1>
        <p>Nhập thông tin đăng nhập để tiếp tục</p>
      </div>

      {error && <div className="auth-form__error">{error}</div>}

      <Field label="Tên đăng nhập" htmlFor="username">
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="Nhập tên đăng nhập"
          value={formData.username}
          onChange={handleChange}
          iconLeft={<User size={18} />}
          required
        />
      </Field>

      <Field label="Mật khẩu" htmlFor="password">
        <div className="auth-form__pwd">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu"
            value={formData.password}
            onChange={handleChange}
            iconLeft={<LockKeyhole size={18} />}
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

      <div className="auth-form__options">
        <label className="auth-form__remember">
          <input
            type="checkbox"
            name="remember"
            checked={formData.remember}
            onChange={handleChange}
          />
          Ghi nhớ đăng nhập
        </label>
        <span className="auth-form__hint">
          <Link to="/forgot-password">Quên mật khẩu?</Link>
        </span>
      </div>

      <Button type="submit" variant="primary" fullWidth loading={loading}>
        Đăng nhập
      </Button>

      <p className="auth-form__switch">
        Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
      </p>
    </form>
  );
}
