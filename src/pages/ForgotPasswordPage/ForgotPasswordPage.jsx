import ForgotPasswordCard from "../../components/ForgotPasswordCard/ForgotPasswordCard";
import ForgotPasswordForm from "../../components/ForgotPasswordForm/ForgotPasswordForm";
import "./ForgotPasswordPage.css";

export default function ForgotPasswordPage() {
  return (
    <div className="forgot-password-page-container">
      <ForgotPasswordCard></ForgotPasswordCard>
      <ForgotPasswordForm></ForgotPasswordForm>
    </div>
  );
}
