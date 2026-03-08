import LoginCard from "../../components/LoginCard/LoginCard";
import RegisterForm from "../../components/RegisterForm/RegisterForm";
import "./RegisterPage.css";

export default function RegisterPage() {
  return (
    <div className="register-page-container">
      <LoginCard></LoginCard>
      <RegisterForm></RegisterForm>
    </div>
  );
}
