import LoginCard from "../../components/LoginCard/LoginCard";
import ChangeForgotPasswordForm from "../../components/ChangeForgotPasswordForm/ChangForgotPasswordForm";
import ForgotPasswordForm from "../../components/ForgotPasswordForm/ForgotPasswordForm";
import VerifyForgotPasswordForm from "../../components/VerifyForgotPasswordForm/VerifyForgotPasswordForm";
import "./ForgotPasswordPage.css";
import { useForgotPassword } from "../../../../stores/contexts/ForgotPasswordContext.jsx";

export default function ForgotPasswordPage() {
  const { currentState } = useForgotPassword();

  return (
    <div className="auth-split">
      <LoginCard />
      <div className="auth-form-panel">
        {currentState === 1 && <ForgotPasswordForm />}
        {currentState === 2 && <VerifyForgotPasswordForm />}
        {currentState === 3 && <ChangeForgotPasswordForm />}
      </div>
    </div>
  );
}
