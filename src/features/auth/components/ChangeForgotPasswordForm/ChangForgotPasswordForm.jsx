import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { useForgotPassword } from "../../../../stores/contexts/ForgotPasswordContext.jsx";
import { resetPassword } from "../../../../services/authService";
import { getErrorMessage } from "../../../../services/apiClient";
import { Button, Field, Input } from "../../../../components/ui";
import "../../styles/authShared.css";

export default function ChangeForgotPasswordForm() {
  const navigate = useNavigate();
  const { confirmedToken } = useForgotPassword();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmNewPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSend = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmNewPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (!confirmedToken) {
      setError("Phiên đặt lại mật khẩu đã hết hạn. Vui lòng thử lại.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const auth = await resetPassword(confirmedToken, formData.newPassword);
      localStorage.setItem("accessToken", auth.accessToken);
      localStorage.setItem("user", JSON.stringify(auth));
      navigate("/app");
    } catch (apiError) {
      setError(getErrorMessage(apiError, "Đặt lại mật khẩu thất bại."));
    } finally {
      setLoading(false);
    }
  };
  return (
    <form className="auth-form" onSubmit={handleSend}>
      <div className="auth-form__head">
        <h1>Tạo mật khẩu mới</h1>
        <p>Mật khẩu tối thiểu 6 ký tự.</p>
      </div>

      {error && <div className="auth-form__error">{error}</div>}

      <Field label="Mật khẩu mới" htmlFor="new-password">
        <Input
          id="new-password"
          name="newPassword"
          type="password"
          placeholder="Nhập mật khẩu mới của bạn"
          value={formData.newPassword}
          onChange={handleChange}
          iconLeft={<LockKeyhole size={18} />}
          minLength={6}
          required
        />
      </Field>
      <Field label="Nhập lại mật khẩu" htmlFor="confirm-new-password">
        <Input
          id="confirm-new-password"
          name="confirmNewPassword"
          type="password"
          placeholder="Xác nhận mật khẩu mới của bạn"
          value={formData.confirmNewPassword}
          onChange={handleChange}
          iconLeft={<LockKeyhole size={18} />}
          minLength={6}
          required
        />
      </Field>

      <p className="auth-info-box">
        Không dùng lại mật khẩu cũ. Bạn sẽ quay về trang đăng nhập sau khi đổi.
      </p>

      <Button type="submit" variant="primary" fullWidth loading={loading}>
        Đổi mật khẩu
      </Button>
    </form>
  );
}
