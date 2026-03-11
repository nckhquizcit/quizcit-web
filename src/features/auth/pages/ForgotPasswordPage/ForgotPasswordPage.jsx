import { useState } from "react";
import ChangeForgotPasswordForm from "../../components/ChangeForgotPasswordForm/ChangForgotPasswordForm";
import ForgotPasswordCard from "../../components/ForgotPasswordCard/ForgotPasswordCard";
import ForgotPasswordForm from "../../components/ForgotPasswordForm/ForgotPasswordForm";
import VerifyForgotPasswordForm from "../../components/VerifyForgotPasswordForm/VerifyForgotPasswordForm";
import "./ForgotPasswordPage.css";
import { useForgotPassword } from "../../../../stores/contexts/ForgotPasswordContext.jsx";

export default function ForgotPasswordPage() {
  const { currentState, setCurrentState } = useForgotPassword();
  return (
    <div className="forgot-password-page-container">
      <ForgotPasswordCard></ForgotPasswordCard>
      {currentState == 1 && <ForgotPasswordForm></ForgotPasswordForm>}
      {currentState == 2 && (
        <VerifyForgotPasswordForm></VerifyForgotPasswordForm>
      )}
      {currentState == 3 && (
        <ChangeForgotPasswordForm></ChangeForgotPasswordForm>
      )}
    </div>
  );
}
