import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../features/auth/pages/LoginPage/LoginPage.jsx";
import RegisterPage from "../features/auth/pages/RegisterPage/RegisterPage";
import VerifyPage from "../features/auth/pages/VerifyPage/VerifyPage.jsx";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage/ForgotPasswordPage.jsx";
import { ForgotPasswordProvider } from "../stores/contexts/ForgotPasswordContext.jsx";
import MainLayout from "../layouts/MainLayout.jsx";
import AdminDashboard from "../features/admin/pages/AdminDashboard";
import AdminChapters from "../features/admin/pages/AdminChapter.jsx";
import AdminSubjects from "../features/admin/pages/AdminSubjects.jsx";
import AdminQuestions from "../features/admin/pages/AdminQuestion.jsx";
import AdminQuizzes from "../features/admin/pages/AdminQuizzes.jsx";
import AdminUsers from "../features/admin/pages/AdminUsers.jsx";
import AdminProfile from "../features/admin/pages/AdminProfile.jsx";
export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout></MainLayout>,
  },
  {
    path: "/admin/dashboard",
    element: <AdminDashboard />,
  },
  {
    path: "/admin/subjects",
    element: <AdminSubjects />,
  },
  {
    path: "/admin/chapters",
    element: <AdminChapters />,
  },
  {
    path: "/admin/questions",
    element: <AdminQuestions />,
  },
  {
    path: "/admin/quizzes",
    element: <AdminQuizzes />,
  },
  {
    path: "/admin/users",
    element: <AdminUsers />,
  },
  {
    path: "/admin/profile",
    element: <AdminProfile />,
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
