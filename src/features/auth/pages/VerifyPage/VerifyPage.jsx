import { useLocation } from "react-router-dom";
import VerifyCard from "../../components/VerifyCard/VerifyCard";
import VerifyForm from "../../components/VerifyForm/VerifyForm";
import "./VerifyPage.css";

export default function VerifyPage() {
  const { state } = useLocation();

  return (
    <div className="auth-split">
      <VerifyCard />
      <div className="auth-form-panel">
        <VerifyForm
          email={state?.email}
          verificationToken={state?.verificationToken}
        />
      </div>
    </div>
  );
}
