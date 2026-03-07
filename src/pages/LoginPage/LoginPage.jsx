import LoginCard from "../../components/LoginCard/LoginCard";
import LoginForm from "../../components/LoginForm/LoginForm";
import "./LoginPage.css";

export default function LoginPage() {
  return (
    <div className="login-page-container">
      <LoginCard></LoginCard>
      <LoginForm></LoginForm>
    </div>
  );
}
