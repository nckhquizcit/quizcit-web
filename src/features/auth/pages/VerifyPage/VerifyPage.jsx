import { useLocation } from "react-router-dom";
import LoginCard from "../../components/LoginCard/LoginCard";
import VerifyForm from "../../components/VerifyForm/VerifyForm";
import "./VerifyPage.css";

export default function VerifyPage() {
  const { state } = useLocation();

  return (
    <div className="auth-split">
      <LoginCard />
      <div className="auth-form-panel">
        <VerifyForm
          email={state?.email}
          verificationToken={state?.verificationToken}
        />
      </div>
    </div>
  );
}
