import {
  House,
  BookOpen,
  History,
  User,
  ChartColumn,
  NotebookText,
  FileQuestionMark,
  BookOpenCheck,
} from "lucide-react";

export const USER_SIDEBAR = [
  {
    id: "user_home",
    label: "Trang chủ",
    path: "/",
    icon: <House size={20} />,
  },
  {
    id: "user_subject",
    label: "Môn học",
    path: "/subjects",
    icon: <BookOpen size={20} />,
  },
  {
    id: "user_history",
    label: "Lịch sử",
    path: "/history",
    icon: <History size={20} />,
  },
  {
    id: "user_profile",
    label: "Cá nhân",
    path: "/profile",
    icon: <User size={20} />,
  },
];

export const ADMIN_SIDEBAR = [
  {
    id: "admin_dashboard",
    label: "Tổng quan",
    path: "/admin",
    icon: <ChartColumn size={20} />,
  },
  {
    id: "admin_subject",
    label: "Quản lý môn học",
    path: "/admin/subjects",
    icon: <BookOpen size={20} />,
  },
  {
    id: "admin_chapter",
    label: "Quản lý chương",
    path: "/admin/chapters",
    icon: <NotebookText size={20} />,
  },
  {
    id: "admin_question",
    label: "Quản lý câu hỏi",
    path: "/admin/questions",
    icon: <FileQuestionMark size={20} />,
  },
  {
    id: "admin_quiz",
    label: "Quản lý đề thi",
    path: "/admin/quizzes",
    icon: <BookOpenCheck size={20} />,
  },
  {
    id: "admin_user",
    label: "Quản lý người dùng",
    path: "/admin/users",
    icon: <User size={20} />,
  },
];
