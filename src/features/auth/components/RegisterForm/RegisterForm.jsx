import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AtSign, Eye, EyeOff, LockKeyhole, User } from "lucide-react";
import { getErrorMessage, isRateLimited } from "../../../../services/apiClient";
import { register } from "../../../../services/authService";
import { Button, Field, Input } from "../../../../components/ui";
import useCountdown from "../../hooks/useCountdown";
import "./RegisterForm.css";

// BE gioi han REGISTER 5 lan / 900s.
const RATE_LIMIT_COOLDOWN_SECONDS = 900;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/;

export default function RegisterForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
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
    setError("");
    setUsernameError("");
    setDisplayNameError("");
    setConfirmError("");

    const trimmedUsername = formData.username.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      setUsernameError("Tên đăng nhập phải từ 3 đến 50 ký tự.");
      return;
    }
    if (!USERNAME_REGEX.test(trimmedUsername)) {
      setUsernameError("Tên đăng nhập không được chứa khoảng trắng, dấu tiếng Việt hoặc ký tự đặc biệt.");
      return;
    }

    const trimmedDisplayName = formData.displayName.trim();
    if (trimmedDisplayName.length === 0) {
      setDisplayNameError("Tên hiển thị không được để trống.");
      return;
    }
    if (trimmedDisplayName.length > 100) {
      setDisplayNameError("Tên hiển thị không được vượt quá 100 ký tự.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setConfirmError("Mật khẩu nhập lại không khớp.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await register({
        username: trimmedUsername,
        password: formData.password,
        email: formData.email,
        displayName: trimmedDisplayName,
      });
      if (!res?.verificationToken) {
        throw new Error("Không nhận được mã xác minh. Vui lòng thử lại.");
      }
      navigate("/verify", {
        state: { email: res.email, verificationToken: res.verificationToken },
      });
    } catch (apiError) {
      if (isRateLimited(apiError)) {
        setError("Bạn đã thử quá nhiều lần. Vui lòng thử lại sau khoảng 15 phút.");
        startCooldown(RATE_LIMIT_COOLDOWN_SECONDS);
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

      {error && <div className="auth-form__error" role="alert">{error}</div>}

      <Field label="Tên đăng nhập" htmlFor="username" error={usernameError}>
        <Input
          id="username"
          name="username"
          type="text"
          placeholder="Nhập tên đăng nhập"
          value={formData.username}
          onChange={handleChange}
          iconLeft={<User size={18} />}
          autoComplete="username"
          minLength={3}
          maxLength={50}
          invalid={Boolean(usernameError)}
          required
        />
      </Field>

      <Field label="Tên hiển thị" htmlFor="displayName" error={displayNameError}>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          placeholder="Nhập tên hiển thị"
          value={formData.displayName}
          onChange={handleChange}
          iconLeft={<User size={18} />}
          autoComplete="name"
          maxLength={100}
          invalid={Boolean(displayNameError)}
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
          maxLength={100}
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
            minLength={6}
            maxLength={255}
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
            minLength={6}
            maxLength={255}
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
