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
const ProfilePage = lazy(
  () => import("../features/profile/pages/ProfilePage/ProfilePage.jsx"),
);
const HistoryPage = lazy(
  () => import("../features/history/pages/HistoryPage/HistoryPage.jsx"),
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
      {
        path: "profile",
        element: (
          <Suspense fallback={<PageLoader></PageLoader>}>
            <ProfilePage></ProfilePage>
          </Suspense>
        ),
      },
      {
        path: "history",
        element: (
          <Suspense fallback={<PageLoader></PageLoader>}>
            <HistoryPage></HistoryPage>
          </Suspense>
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

  // 3. Admin Routes (Bảo mật nghiêm ngặt)
  {
    path: "/admin",
    element: (
      //<ProtectedRoute roles={["ADMIN"]}>
      <AdminLayout />
      //</ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      {
        path: "dashboard",
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminDashboard />
          </Suspense>
        ),
      },
      {
        path: "subjects",
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminSubjects />
          </Suspense>
        ),
      },
      {
        path: "chapters",
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminChapters />
          </Suspense>
        ),
      },
      {
        path: "questions",
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminQuestions />
          </Suspense>
        ),
      },
      {
        path: "quizzes",
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminQuizzes />
          </Suspense>
        ),
      },
      {
        path: "users",
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminUsers />
          </Suspense>
        ),
      },
      {
        path: "profile",
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdminProfile />
          </Suspense>
        ),
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
