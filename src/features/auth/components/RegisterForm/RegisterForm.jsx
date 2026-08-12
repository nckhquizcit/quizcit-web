import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AtSign, LockKeyhole, User } from "lucide-react";
import { getErrorMessage } from "../../../../services/apiClient";
import { register } from "../../../../services/authService";
import { Button, Field, Input } from "../../../../components/ui";
import "./RegisterForm.css";

export default function RegisterForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
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
      navigate("/verify", {
        state: { email: res.email, verificationToken: res.verificationToken },
      });
    } catch (apiError) {
      setError(getErrorMessage(apiError, "Đăng ký thất bại."));
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
          required
        />
      </Field>

      <Field label="Mật khẩu" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Nhập mật khẩu"
          value={formData.password}
          onChange={handleChange}
          iconLeft={<LockKeyhole size={18} />}
          required
        />
      </Field>

      <Field label="Nhập lại mật khẩu" htmlFor="confirmPassword">
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Xác nhận lại mật khẩu"
          value={formData.confirmPassword}
          onChange={handleChange}
          iconLeft={<LockKeyhole size={18} />}
          required
        />
      </Field>

      <Button type="submit" variant="primary" fullWidth loading={loading}>
        Đăng ký
      </Button>

      <p className="auth-form__switch">
        Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
      </p>
    </form>
  );
}
