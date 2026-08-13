/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import AdminLayout from "../features/admin/AdminLayout.jsx";
import ProtectedRoute from "../features/admin/components/guard/ProtectedRoute.jsx";
import { ForgotPasswordProvider } from "../stores/contexts/ForgotPasswordContext.jsx";
import { Spinner } from "../components/ui";

const HomePage = lazy(() => import("../features/home/pages/HomePage/HomePage.jsx"));
const SubjectsPage = lazy(() => import("../features/subjects/pages/SubjectsPage/SubjectsPage.jsx"));
const SubjectDetailPage = lazy(
  () => import("../features/subjects/pages/SubjectDetailPage/SubjectDetailPage.jsx"),
);
const TheoryPage = lazy(() => import("../features/content/pages/TheoryPage/TheoryPage.jsx"));
const ProfilePage = lazy(() => import("../features/profile/pages/ProfilePage/ProfilePage.jsx"));
const HistoryPage = lazy(() => import("../features/history/pages/HistoryPage/HistoryPage.jsx"));
const ProgressPage = lazy(() => import("../features/progress/pages/ProgressPage/ProgressPage.jsx"));
const SkillsPage = lazy(() => import("../features/progress/pages/SkillsPage/SkillsPage.jsx"));
const SkillDetailPage = lazy(
  () => import("../features/progress/pages/SkillDetailPage/SkillDetailPage.jsx"),
);
const QuizTakingPage = lazy(() => import("../features/quiz/pages/QuizTakingPage/QuizTakingPage.jsx"));
const QuizResultPage = lazy(() => import("../features/quiz/pages/QuizResultPage/QuizResultPage.jsx"));
const AdaptiveQuizPage = lazy(() => import("../features/quiz/pages/AdaptiveQuizPage/AdaptiveQuizPage.jsx"));

const AdminDashboard = lazy(() => import("../features/admin/pages/AdminDashboard.jsx"));
const AdminSubjects = lazy(() => import("../features/admin/pages/AdminSubjects.jsx"));
const AdminChapters = lazy(() => import("../features/admin/pages/AdminChapter.jsx"));
const AdminQuestions = lazy(() => import("../features/admin/pages/AdminQuestion.jsx"));
const AdminQuestionCreate = lazy(() => import("../features/admin/pages/AdminQuestionCreate.jsx"));
const AdminQuestionImport = lazy(() => import("../features/admin/pages/AdminQuestionImport.jsx"));
const AdminQuizzes = lazy(() => import("../features/admin/pages/AdminQuizzes.jsx"));
const AdminQuizCreate = lazy(() => import("../features/admin/pages/AdminQuizCreate.jsx"));
const AdminSubjectEdit = lazy(() => import("../features/admin/pages/AdminSubjectEdit.jsx"));
const AdminChapterEdit = lazy(() => import("../features/admin/pages/AdminChapterEdit.jsx"));
const AdminQuizEdit = lazy(() => import("../features/admin/pages/AdminQuizEdit.jsx"));
const AdminQuizQuestions = lazy(() => import("../features/admin/pages/AdminQuizQuestions.jsx"));
const AdminSkills = lazy(() => import("../features/admin/pages/AdminSkills.jsx"));
const AdminUsers = lazy(() => import("../features/admin/pages/AdminUsers.jsx"));
const AdminProfile = lazy(() => import("../features/admin/pages/AdminProfile.jsx"));

const LoginPage = lazy(() => import("../features/auth/pages/LoginPage/LoginPage.jsx"));
const RegisterPage = lazy(() => import("../features/auth/pages/RegisterPage/RegisterPage.jsx"));
const VerifyPage = lazy(() => import("../features/auth/pages/VerifyPage/VerifyPage.jsx"));
const ForgotPasswordPage = lazy(
  () => import("../features/auth/pages/ForgotPasswordPage/ForgotPasswordPage.jsx"),
);

function PageLoader() {
  return (
    <div className="page-loader">
      <Spinner size={28} />
      <span>Đang tải...</span>
    </div>
  );
}

function AccessDeniedPage() {
  return (
    <div className="page-loader">
      <h1>Không có quyền truy cập</h1>
      <p>Bạn không có quyền thực hiện thao tác này.</p>
    </div>
  );
}

const withSuspense = (element) => <Suspense fallback={<PageLoader />}>{element}</Suspense>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: "subjects", element: withSuspense(<SubjectsPage />) },
      { path: "subjects/:subjectId", element: withSuspense(<SubjectDetailPage />) },
      {
        path: "subjects/:subjectId/theories/:theoryId",
        element: withSuspense(<TheoryPage />),
      },
      { path: "quiz/:quizId", element: withSuspense(<QuizTakingPage />) },
      { path: "adaptive/:attemptId", element: withSuspense(<AdaptiveQuizPage />) },
      { path: "quiz/result/:attemptId", element: withSuspense(<QuizResultPage />) },
      { path: "history", element: withSuspense(<HistoryPage />) },
      { path: "progress", element: withSuspense(<ProgressPage />) },
      { path: "progress/skills", element: withSuspense(<SkillsPage />) },
      { path: "progress/skills/:skillId", element: withSuspense(<SkillDetailPage />) },
      { path: "profile", element: withSuspense(<ProfilePage />) },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "login", element: withSuspense(<LoginPage />) },
      { path: "register", element: withSuspense(<RegisterPage />) },
      { path: "verify", element: withSuspense(<VerifyPage />) },
      {
        path: "forgot-password",
        element: withSuspense(
          <ForgotPasswordProvider>
            <ForgotPasswordPage />
          </ForgotPasswordProvider>,
        ),
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute roles={["ADMINISTRATOR"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: withSuspense(<AdminDashboard />) },
      { path: "skills", element: withSuspense(<AdminSkills />) },
      { path: "subjects", element: withSuspense(<AdminSubjects />) },
      { path: "subjects/:subjectId/edit", element: withSuspense(<AdminSubjectEdit />) },
      { path: "subjects/:subjectId/chapters", element: withSuspense(<AdminChapters />) },
      { path: "subjects/:subjectId/chapters/:chapterId/edit", element: withSuspense(<AdminChapterEdit />) },
      {
        path: "subjects/:subjectId/chapters/:chapterId/questions/new",
        element: withSuspense(<AdminQuestionCreate />),
      },
      {
        path: "subjects/:subjectId/chapters/:chapterId/questions/import",
        element: withSuspense(<AdminQuestionImport />),
      },
      {
        path: "subjects/:subjectId/chapters/:chapterId/questions",
        element: withSuspense(<AdminQuestions />),
      },
      { path: "questions/new", element: withSuspense(<AdminQuestionCreate />) },
      { path: "questions/import", element: withSuspense(<AdminQuestionImport />) },
      { path: "questions", element: withSuspense(<AdminQuestions />) },
      { path: "quizzes/new", element: withSuspense(<AdminQuizCreate />) },
      { path: "quizzes/:quizId/edit", element: withSuspense(<AdminQuizEdit />) },
      { path: "quizzes/:quizId/edit/questions", element: withSuspense(<AdminQuizQuestions />) },
      { path: "quizzes", element: withSuspense(<AdminQuizzes />) },
      { path: "users", element: withSuspense(<AdminUsers />) },
      { path: "profile", element: withSuspense(<AdminProfile />) },
    ],
  },
  {
    path: "/unauthorized",
    element: <AccessDeniedPage />,
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
