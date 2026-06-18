import VerifyCard from "../../components/VerifyCard/VerifyCard";
import VerifyForm from "../../components/VerifyForm/VerifyForm";
import "./VerifyPage.css";

export default function VerifyPage() {
  return (
    <div className="verify-page-container">
      <VerifyCard></VerifyCard>
      <VerifyForm></VerifyForm>
    </div>
  );
}
