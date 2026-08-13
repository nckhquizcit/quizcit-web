import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, User } from "lucide-react";
import {
  getErrorMessage,
  isRateLimited,
  saveAuthSession,
} from "../../../../services/apiClient";
import { login } from "../../../../services/authService";
import { Button, Field, Input } from "../../../../components/ui";
import useCountdown from "../../hooks/useCountdown";
import "../../styles/authShared.css";
import "./LoginForm.css";

export default function LoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [needsVerify, setNeedsVerify] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, startCooldown] = useCountdown();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const goToVerify = () => {
    const identifier = formData.username.trim();
    navigate("/verify", {
      state: { email: identifier.includes("@") ? identifier : "" },
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (cooldown > 0) return;
    try {
      setLoading(true);
      setError("");
      const auth = await login(formData.username, formData.password);
      if (!auth?.accessToken) {
        throw new Error("Đăng nhập thất bại. Vui lòng thử lại.");
      }
      saveAuthSession(auth);
      navigate(auth.role === "ADMINISTRATOR" ? "/admin" : "/app");
    } catch (apiError) {
      if (isRateLimited(apiError)) {
        setError("Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.");
        startCooldown();
      } else {
        const message = getErrorMessage(apiError, "Đăng nhập thất bại.");
        // 403 co the la "chua xac thuc" hoac "bi khoa" (BE chua co ma loi rieng);
        // chi moi xac thuc khi dung truong hop, tranh day user bi khoa vao vong lap verify.
        setNeedsVerify(
          apiError?.status === 403 && message.toLowerCase().includes("chưa xác thực"),
        );
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleLogin}>
      <div className="auth-form__head">
        <h1>Đăng nhập</h1>
        <p>Nhập thông tin để tiếp tục học.</p>
      </div>

      {error && (
        <div className="auth-form__error-group">
          <div className="auth-form__error">{error}</div>
          {needsVerify && (
            <button
              type="button"
              className="auth-form__error-action"
              onClick={goToVerify}
            >
              Xác thực tài khoản
            </button>
          )}
        </div>
      )}

      <Field label="Tên đăng nhập hoặc email" htmlFor="username">
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="Nhập tên đăng nhập hoặc email"
          value={formData.username}
          onChange={handleChange}
          iconLeft={<User size={18} />}
          autoComplete="username"
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
            autoComplete="current-password"
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
        <span className="auth-form__hint">
          <Link to="/forgot-password">Quên mật khẩu?</Link>
        </span>
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={loading}
        disabled={cooldown > 0}
      >
        {cooldown > 0 ? `Thử lại sau ${cooldown}s` : "Đăng nhập"}
      </Button>

      <p className="auth-form__switch">
        Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
      </p>

      <div className="auth-divider" />
      <p className="auth-mini-note">
        Đăng nhập sẽ chuyển theo vai trò User / Admin
      </p>
    </form>
  );
}
