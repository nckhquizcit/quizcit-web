import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage/RegisterPage";
import VerifyPage from "../pages/VerifyPage/VerifyPage.jsx";
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace></Navigate>,
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
]);
