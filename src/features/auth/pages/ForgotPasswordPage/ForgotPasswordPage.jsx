import LoginCard from "../../components/LoginCard/LoginCard";
import ChangeForgotPasswordForm from "../../components/ChangeForgotPasswordForm/ChangForgotPasswordForm";
import ForgotPasswordForm from "../../components/ForgotPasswordForm/ForgotPasswordForm";
import VerifyForgotPasswordForm from "../../components/VerifyForgotPasswordForm/VerifyForgotPasswordForm";
import "./ForgotPasswordPage.css";
import { useForgotPassword } from "../../../../stores/contexts/ForgotPasswordContext.jsx";

export default function ForgotPasswordPage() {
  const { currentState, sessionReset } = useForgotPassword();

  return (
    <div className="auth-split">
      <LoginCard />
      <div className="auth-form-panel">
        {/* Fallback ve buoc 1: khong de vung form trong neu currentState la gia tri la. */}
        {currentState === 2 ? (
          <VerifyForgotPasswordForm />
        ) : currentState === 3 ? (
          <ChangeForgotPasswordForm />
        ) : (
          <ForgotPasswordForm sessionReset={sessionReset} />
        )}
      </div>
    </div>
  );
}
