import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AtSign, Eye, EyeOff, LockKeyhole, User } from "lucide-react";
import { getErrorMessage, isRateLimited } from "../../../../services/apiClient";
import { register } from "../../../../services/authService";
import { Button, Field, Input } from "../../../../components/ui";
import useCountdown from "../../hooks/useCountdown";
import "./RegisterForm.css";

export default function RegisterForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, startCooldown] = useCountdown();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setConfirmError("");
    if (formData.password !== formData.confirmPassword) {
      setConfirmError("Mật khẩu nhập lại không khớp.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await register({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        displayName: formData.username,
      });
      if (!res?.verificationToken) {
        throw new Error("Không nhận được mã xác minh. Vui lòng thử lại.");
      }
      navigate("/verify", {
        state: { email: res.email, verificationToken: res.verificationToken },
      });
    } catch (apiError) {
      if (isRateLimited(apiError)) {
        setError("Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.");
        startCooldown();
      } else {
        setError(getErrorMessage(apiError, "Đăng ký thất bại."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleRegister}>
      <div className="auth-form__head">
        <h1>Tạo tài khoản</h1>
        <p>Bắt đầu ôn tập cùng QuizCIT.</p>
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
          autoComplete="username"
          required
        />
      </Field>

      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="example@gmail.com"
          value={formData.email}
          onChange={handleChange}
          iconLeft={<AtSign size={18} />}
          autoComplete="email"
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
            autoComplete="new-password"
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

      <Field
        label="Nhập lại mật khẩu"
        htmlFor="confirmPassword"
        error={confirmError}
      >
        <div className="auth-form__pwd">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Xác nhận lại mật khẩu"
            value={formData.confirmPassword}
            onChange={handleChange}
            iconLeft={<LockKeyhole size={18} />}
            autoComplete="new-password"
            invalid={Boolean(confirmError)}
            required
          />
          <button
            type="button"
            className="auth-form__pwd-toggle"
            onClick={() => setShowConfirmPassword((v) => !v)}
            aria-label={
              showConfirmPassword
                ? "Ẩn mật khẩu nhập lại"
                : "Hiện mật khẩu nhập lại"
            }
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </Field>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={loading}
        disabled={cooldown > 0}
      >
        {cooldown > 0 ? `Thử lại sau ${cooldown}s` : "Đăng ký"}
      </Button>

      <p className="auth-form__switch">
        Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
      </p>
    </form>
  );
}
