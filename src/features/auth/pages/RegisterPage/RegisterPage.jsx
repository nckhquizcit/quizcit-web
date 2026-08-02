import LoginCard from "../../components/LoginCard/LoginCard";
import RegisterForm from "../../components/RegisterForm/RegisterForm";
import "./RegisterPage.css";

export default function RegisterPage() {
  return (
    <div className="auth-split">
      <LoginCard />
      <div className="auth-form-panel">
        <RegisterForm />
      </div>
    </div>
  );
}
