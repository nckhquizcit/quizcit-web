/* eslint-disable react-refresh/only-export-components */
import React, { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

// Layouts
import MainLayout from "../layouts/MainLayout.jsx";
import AdminLayout from "../features/admin/AdminLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";

// Guards & Providers
import ProtectedRoute from "../features/admin/components/guard/ProtectedRoute.jsx";
import { ForgotPasswordProvider } from "../stores/contexts/ForgotPasswordContext.jsx";


const HomePage = lazy(
  () => import("../features/home/pages/HomePage/HomePage.jsx"),
);
const SubjectsPage = lazy(
  () => import("../features/subjects/pages/SubjectsPage/SubjectsPage.jsx"),
);
const SubjectDetailPage = lazy(
  () => import("../features/subjects/pages/SubjectDetailPage/SubjectDetailPage.jsx"),
);
// const HistoryPage = lazy(
//   () => import("../features/history/pages/HistoryPage/HistoryPage.jsx"),
// );
// const ProfilePage = lazy(
//   () => import("../features/profile/pages/ProfilePage/ProfilePage.jsx"),
// );

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
const AdminSkills = lazy(
  () => import("../features/admin/pages/AdminSkills.jsx"),
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

// Quiz pages
const QuizTakingPage = lazy(
  () => import("../features/quiz/pages/QuizTakingPage/QuizTakingPage.jsx"),
);
const QuizResultPage = lazy(
  () => import("../features/quiz/pages/QuizResultPage/QuizResultPage.jsx"),
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

const withSuspense = (element) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
);


export const router = createBrowserRouter([
  // 1. Public Routes (Dành cho khách)
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/app",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: withSuspense(<HomePage />),
      },
      {
        path: "subjects",
        element: withSuspense(<SubjectsPage />),
      },
      {
        path: "subjects/:subjectId",
        element: withSuspense(<SubjectDetailPage />),
      },
      {
        path: "quiz/:quizId",
        element: withSuspense(<QuizTakingPage />),
      },
      {
        path: "quiz/result/:attemptId",
        element: withSuspense(<QuizResultPage />),
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
        path: "questions",
        element: <AdminQuestions />,
      },

      {
        path: "quizzes",
        element: <AdminQuizzes />,
      },

      {
        path: "skills",
        element: <AdminSkills />,
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
    path: "/forgot-password",
    element: (
      <ForgotPasswordProvider>
        <ForgotPasswordPage></ForgotPasswordPage>
      </ForgotPasswordProvider>
    ),
  },
]);