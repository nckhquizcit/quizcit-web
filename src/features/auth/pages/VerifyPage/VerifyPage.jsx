import { useLocation } from "react-router-dom";
import LoginCard from "../../components/LoginCard/LoginCard";
import VerifyForm from "../../components/VerifyForm/VerifyForm";
import "./VerifyPage.css";

export default function VerifyPage() {
  const { state } = useLocation();
  // Reload lam mat location.state (gioi han cua router): bao cho user biet phien da ket thuc.
  const sessionExpired = !state?.email && !state?.verificationToken;

  return (
    <div className="auth-split">
      <LoginCard />
      <div className="auth-form-panel">
        <VerifyForm
          email={state?.email}
          verificationToken={state?.verificationToken}
          sessionExpired={sessionExpired}
        />
      </div>
    </div>
  );
}
