import React, { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

// Layouts
import MainLayout from "../layouts/MainLayout.jsx";
import AdminLayout from "../features/admin/AdminLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";

// Guards & Providers
import ProtectedRoute from "../features/admin/components/guard/ProtectedRoute.jsx";
import { ForgotPasswordProvider } from "../stores/contexts/ForgotPasswordContext.jsx";

// Lazy Loading các Page (Tăng performance)
const AdminDashboard = lazy(
  () => import("../features/admin/pages/AdminDashboard"),
);
const AdminSubjects = lazy(
  () => import("../features/admin/pages/AdminSubjects.jsx"),
);
const AdminChapters = lazy(
  () => import("../features/admin/pages/AdminChapter.jsx"),
);
const AdminQuestions = lazy(
  () => import("../features/admin/pages/AdminQuestion.jsx"),
);
const AdminQuizzes = lazy(
  () => import("../features/admin/pages/AdminQuizzes.jsx"),
);
const AdminUsers = lazy(() => import("../features/admin/pages/AdminUsers.jsx"));
const AdminProfile = lazy(
  () => import("../features/admin/pages/AdminProfile.jsx"),
);

const LoginPage = lazy(
  () => import("../features/auth/pages/LoginPage/LoginPage.jsx"),
);
const RegisterPage = lazy(
  () => import("../features/auth/pages/RegisterPage/RegisterPage"),
);
const VerifyPage = lazy(
  () => import("../features/auth/pages/VerifyPage/VerifyPage.jsx"),
);
const ForgotPasswordPage = lazy(
  () =>
    import("../features/auth/pages/ForgotPasswordPage/ForgotPasswordPage.jsx"),
);

// Loading Component
const PageLoader = () => (
  <div
    className="page-loader"
    style={{ padding: "50px", textAlign: "center", fontWeight: "bold" }}
  >
    Đang tải hệ thống...
  </div>
);

export const router = createBrowserRouter([
  // 1. Public Routes (Dành cho khách)
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: (
          <div style={{ padding: "20px" }}>Chào mừng bạn đến với hệ thống!</div>
        ),
      },
    ],
  },

  // 2. Auth Routes (Login, Register...)
  {
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: (
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: "register",
        element: (
          <Suspense fallback={<PageLoader />}>
            <RegisterPage />
          </Suspense>
        ),
      },
      {
        path: "verify",
        element: (
          <Suspense fallback={<PageLoader />}>
            <VerifyPage />
          </Suspense>
        ),
      },
      {
        path: "forgot-password",
        element: (
          <ForgotPasswordProvider>
            <Suspense fallback={<PageLoader />}>
              <ForgotPasswordPage />
            </Suspense>
          </ForgotPasswordProvider>
        ),
      },
    ],
  },

  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },

      {
        path: "dashboard",
        element: <AdminDashboard />,
      },

      {
        path: "subjects",
        element: <AdminSubjects />,
      },

      {
        path: "subjects/:subjectId/chapters",
        element: <AdminChapters />,
      },

      {
        path: "subjects/:subjectId/chapters/:chapterId/questions",
        element: <AdminQuestions />,
      },

      {
        path: "quizzes",
        element: <AdminQuizzes />,
      },

      {
        path: "users",
        element: <AdminUsers />,
      },

      {
        path: "profile",
        element: <AdminProfile />,
      },
    ],
  },

  // 4. Error Routes
  {
    path: "/unauthorized",
    element: (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>403</h1>
        <p>Bạn không có quyền truy cập!</p>
      </div>
    ),
  },
  {
    path: "*",
    element: (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>404</h1>
        <p>Trang không tồn tại!</p>
      </div>
    ),
  },
]);
