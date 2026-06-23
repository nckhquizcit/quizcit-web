import {
  House,
  BookOpen,
  Brain,
  History,
  User,
  ChartColumn,
  Database,
  BookOpenCheck,
} from "lucide-react";

export const USER_SIDEBAR = [
  {
    id: "user_home",
    label: "Trang chủ",
    path: "/app",
    icon: <House size={20} />,
    end: true,
  },
  {
    id: "user_subject",
    label: "Môn học",
    path: "/app/subjects",
    icon: <BookOpen size={20} />,
  },
  {
    id: "user_history",
    label: "Lịch sử",
    path: "/app/history",
    icon: <History size={20} />,
  },
  {
    id: "user_profile",
    label: "Cá nhân",
    path: "/app/profile",
    icon: <User size={20} />,
  },
];

export const ADMIN_SIDEBAR = [
  {
    id: "admin_dashboard",
    label: "Tổng quan",
    path: "/admin/dashboard",
    icon: <ChartColumn size={20} />,
  },
  {
    id: "admin_subject",
    label: "Quản lý môn học",
    path: "/admin/subjects",
    icon: <BookOpen size={20} />,
  },
  {
    id: "admin_question_bank",
    label: "Ngân hàng câu hỏi",
    path: "/admin/questions",
    icon: <Database size={20} />,
  },
  {
    id: "admin_user",
    label: "Quản lý người dùng",
    path: "/admin/users",
    icon: <User size={20} />,
  },
  {
    id: "admin_quiz",
    label: "Quản lý đề thi",
    path: "/admin/quizzes",
    icon: <BookOpenCheck size={20} />,
  },
  {
    id: "admin_skill",
    label: "Quản lý kỹ năng",
    path: "/admin/skills",
    icon: <Brain size={20} />,
  },
];
