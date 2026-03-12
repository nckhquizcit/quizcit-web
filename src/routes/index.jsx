import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../features/auth/pages/LoginPage/LoginPage.jsx";
import RegisterPage from "../features/auth/pages/RegisterPage/RegisterPage";
import VerifyPage from "../features/auth/pages/VerifyPage/VerifyPage.jsx";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage/ForgotPasswordPage.jsx";
import { ForgotPasswordProvider } from "../stores/contexts/ForgotPasswordContext.jsx";
import MainLayout from "../layouts/MainLayout.jsx";
export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout></MainLayout>,
  },
  {
    path: "/login",
    element: <LoginPage></LoginPage>,
  },
  {
    path: "/register",
    element: <RegisterPage></RegisterPage>,
  },
  {
    path: "/verify",
    element: <VerifyPage></VerifyPage>,
  },
  {
    path: "/forgot-password",
    element: (
      <ForgotPasswordProvider>
        <ForgotPasswordPage></ForgotPasswordPage>
      </ForgotPasswordProvider>
    ),
  },
]);
