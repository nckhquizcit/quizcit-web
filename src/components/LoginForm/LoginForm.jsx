import { useState } from "react";
import "./LoginForm.css";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  return (
    <form
      className="login-form-container"
      onSubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}
    >
      <h1>Đăng nhập</h1>
      <p className="text-gray-500">Nhập thông tin đăng nhập để tiếp tục</p>

      <div className="input-container">
        <label htmlFor="username">Tên đăng nhập</label>
        <input
          id="username"
          name="username"
          type="text"
          placeholder="Nhập tên đăng nhập"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="remember-container">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>Ghi nhớ tôi</span>
        </label>
      </div>

      <button type="submit" className="login-button">
        Đăng nhập
      </button>
      <div className="register-section">
        <p>
          Chưa có tài khoản? <a href="google.com">Đăng ký</a>
        </p>
      </div>
    </form>
  );
}
