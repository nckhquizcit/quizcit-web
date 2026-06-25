import VerifyCard from "../../components/VerifyCard/VerifyCard";
import VerifyForm from "../../components/VerifyForm/VerifyForm";
import "./VerifyPage.css";

export default function VerifyPage() {
  return (
    <div className="auth-split">
      <VerifyCard />
      <div className="auth-form-panel">
        <VerifyForm />
      </div>
    </div>
  );
}
