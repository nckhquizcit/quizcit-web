import { useEffect, useMemo, useState } from "react";
import { Award, BookOpen, Flame, Target, Trophy, Zap, X } from "lucide-react";
import AchievementCard from "../../components/AchievementCard/AchievementCard";
import ProfileHeader from "../../components/ProfileHeader/ProfileHeader";
import { getErrorMessage, getStoredUser, setStoredUser } from "../../../../services/apiClient";
import {
  changeCurrentUserPassword,
  getCurrentUser,
  updateCurrentUserProfile,
} from "../../../../services/userService";
import { getUserAttempts } from "../../../../services/quizService";
import {
  Badge,
  Button,
  Field,
  Input,
  Spinner,
  ErrorState,
  useToast,
} from "../../../../components/ui";
import "./ProfilePage.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;

function capProgress(value, total) {
  const progress = Number(value) || 0;
  return Math.max(0, Math.min(progress, total));
}

function getAttemptPercentage(attempt) {
  const directPercentage = Number(attempt?.percentage);
  if (Number.isFinite(directPercentage)) return directPercentage;

  const rawScore = Number(attempt?.rawScore);
  const totalQuestion = Number(attempt?.totalQuestion);
  if (!Number.isFinite(rawScore) || !Number.isFinite(totalQuestion) || totalQuestion <= 0) {
    return 0;
  }

  return (rawScore / totalQuestion) * 100;
}

function mergeAndStoreUser(nextUser) {
  const storedUser = getStoredUser() || {};
  const mergedUser = {
    ...storedUser,
    ...nextUser,
    accessToken: storedUser.accessToken,
    tokenType: storedUser.tokenType,
    expiresAt: storedUser.expiresAt,
  };

  setStoredUser(mergedUser);
  return mergedUser;
}

function ProfileModal({ title, children, onClose }) {
  return (
    <div className="profile-modal-backdrop" onMouseDown={onClose}>
      <div
        className="profile-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="profile-modal-header">
          <h3 id="profile-modal-title">{title}</h3>
          <button className="profile-modal-close" type="button" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const toast = useToast();
  const [profileUser, setProfileUser] = useState(() => getStoredUser());
  const [attempts, setAttempts] = useState([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoadingProfile(true);
      setProfileError("");

      try {
        const user = await getCurrentUser();
        const mergedUser = mergeAndStoreUser(user);
        const attemptRows = mergedUser?.userId ? await getUserAttempts(mergedUser.userId) : [];
        if (!isMounted) return;
        setProfileUser(mergedUser);
        setAttempts(attemptRows || []);
      } catch (error) {
        if (!isMounted) return;
        setProfileError(getErrorMessage(error, "Không thể tải hồ sơ người dùng."));
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const completedQuizzes = attempts.length;
  const highScoreQuizzes = attempts.filter((attempt) => getAttemptPercentage(attempt) >= 90).length;
  const completedQuestions = attempts.reduce(
    (sum, attempt) => sum + (Number(attempt?.totalQuestion) || 0),
    0,
  );
  const achievementsCount = [
    completedQuizzes >= 1,
    completedQuizzes >= 10,
    highScoreQuizzes >= 5,
    completedQuestions >= 50,
  ].filter(Boolean).length;

  const userData = useMemo(
    () => ({
      name: profileUser?.displayName || profileUser?.username || "Người dùng",
      username: profileUser?.username || "unknown",
      xp: 0,
      completedQuizzes,
      achievementsCount,
    }),
    [achievementsCount, completedQuizzes, profileUser],
  );

  const achievements = [
    {
      id: 1,
      title: "Bước đầu tiên",
      description: "Hoàn thành bài kiểm tra đầu tiên của bạn",
      icon: Target,
      progress: capProgress(completedQuizzes, 1),
      total: 1,
      rank: "Đồng",
      isActive: completedQuizzes >= 1,
      isLocked: completedQuizzes < 1,
    },
    {
      id: 2,
      title: "Học viên tập sự",
      description: "Hoàn thành 10 bài kiểm tra",
      icon: BookOpen,
      progress: capProgress(completedQuizzes, 10),
      total: 10,
      rank: "Bạc",
      isActive: completedQuizzes >= 10,
      isLocked: false,
    },
    {
      id: 3,
      title: "Chuỗi học tập",
      description: "Học tập liên tục trong 7 ngày",
      icon: Flame,
      progress: 0,
      total: 7,
      rank: "Vàng",
      isActive: false,
      isLocked: true,
    },
    {
      id: 4,
      title: "Bậc thầy quiz",
      description: "Đạt điểm trên 90% trong 5 bài quiz",
      icon: Trophy,
      progress: 0,
      total: 5,
      rank: "Kim cương",
      isActive: false,
      isLocked: true,
    },
    {
      id: 5,
      title: "Tốc độ",
      description: "Hoàn thành một bài quiz trong nửa thời gian",
      icon: Zap,
      progress: 0,
      total: 1,
      rank: "Bạc",
      isActive: false,
      isLocked: true,
    },
    {
      id: 6,
      title: "Nỗ lực bền bỉ",
      description: "Hoàn thành 50 câu hỏi",
      icon: Award,
      progress: 0,
      total: 50,
      rank: "Vàng",
      isActive: false,
      isLocked: true,
    },
  ];

  const resolvedAchievements = achievements.map((achievement) => {
    if (achievement.id === 1) {
      return {
        ...achievement,
        progress: capProgress(completedQuizzes, achievement.total),
        isActive: completedQuizzes >= achievement.total,
        isLocked: completedQuizzes < achievement.total,
      };
    }

    if (achievement.id === 2) {
      return {
        ...achievement,
        progress: capProgress(completedQuizzes, achievement.total),
        isActive: completedQuizzes >= achievement.total,
        isLocked: false,
      };
    }

    if (achievement.id === 4) {
      return {
        ...achievement,
        progress: capProgress(highScoreQuizzes, achievement.total),
        isActive: highScoreQuizzes >= achievement.total,
        isLocked: highScoreQuizzes < achievement.total,
      };
    }

    if (achievement.id === 6) {
      return {
        ...achievement,
        progress: capProgress(completedQuestions, achievement.total),
        isActive: completedQuestions >= achievement.total,
        isLocked: completedQuestions < achievement.total,
      };
    }

    return achievement;
  });

  function openNameModal() {
    setFormError("");
    setForm((current) => ({
      ...current,
      displayName: profileUser?.displayName || profileUser?.username || "",
    }));
    setActiveModal("name");
  }

  function openEmailModal() {
    setFormError("");
    setForm((current) => ({
      ...current,
      email: profileUser?.email || "",
    }));
    setActiveModal("email");
  }

  function openPasswordModal() {
    setFormError("");
    setForm((current) => ({
      ...current,
      password: "",
      confirmPassword: "",
    }));
    setActiveModal("password");
  }

  function closeModal() {
    if (isSubmitting) return;
    setActiveModal(null);
    setFormError("");
  }

  async function submitProfileUpdate(event, type) {
    event.preventDefault();
    setFormError("");

    const displayName = form.displayName.trim();
    const email = form.email.trim();
    const currentDisplayName = profileUser?.displayName || profileUser?.username || "";
    const currentEmail = profileUser?.email || "";

    let payload;
    let successMessage;

    if (type === "name") {
      if (!displayName) {
        setFormError("Vui lòng nhập tên hiển thị.");
        return;
      }

      if (displayName.length > 100) {
        setFormError("Tên hiển thị không được vượt quá 100 ký tự.");
        return;
      }

      payload = { displayName, email: currentEmail };
      successMessage = "Đã cập nhật tên hiển thị.";
    }

    if (type === "email") {
      if (!email) {
        setFormError("Vui lòng nhập email.");
        return;
      }

      if (!EMAIL_PATTERN.test(email)) {
        setFormError("Email không hợp lệ.");
        return;
      }

      payload = { displayName: currentDisplayName, email };
      successMessage = "Đã cập nhật email.";
    }

    setIsSubmitting(true);

    try {
      const updatedUser = await updateCurrentUserProfile(payload);
      setProfileUser(mergeAndStoreUser(updatedUser));
      toast.success(successMessage);
      setActiveModal(null);
    } catch (error) {
      setFormError(getErrorMessage(error, "Không thể cập nhật hồ sơ."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitPasswordUpdate(event) {
    event.preventDefault();
    setFormError("");

    const password = form.password.trim();
    const confirmPassword = form.confirmPassword.trim();

    if (password.length < PASSWORD_MIN_LENGTH) {
      setFormError(`Mật khẩu cần ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`);
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);

    try {
      await changeCurrentUserPassword(password);
      toast.success("Đã cập nhật mật khẩu.");
      setActiveModal(null);
      setForm((current) => ({ ...current, password: "", confirmPassword: "" }));
    } catch (error) {
      setFormError(getErrorMessage(error, "Không thể cập nhật mật khẩu."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="profile-page-wrapper">
      <ProfileHeader
        user={userData}
        onOpenChangeName={openNameModal}
        onOpenChangeEmail={openEmailModal}
        onOpenChangePassword={openPasswordModal}
      />

      {isLoadingProfile && (
        <div className="profile-inline-loading">
          <Spinner size={18} />
          <span>Đang tải hồ sơ...</span>
        </div>
      )}

      {profileError && (
        <ErrorState
          description={profileError}
          onRetry={() => window.location.reload()}
        />
      )}

      <section className="achievements-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Thành tích</h2>
            <p className="section-subtitle">Theo dõi các mốc học tập của bạn</p>
          </div>
          <Badge variant="primary">
            {userData.achievementsCount} đã mở khóa
          </Badge>
        </div>

        <div className="achievements-grid">
          {resolvedAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} {...achievement} />
          ))}
        </div>
      </section>

      {activeModal === "name" && (
        <ProfileModal title="Đổi tên hiển thị" onClose={closeModal}>
          <form
            className="profile-modal-content"
            onSubmit={(event) => submitProfileUpdate(event, "name")}
          >
            <Field label="Tên hiển thị" htmlFor="profile-display-name" error={formError}>
              <Input
                id="profile-display-name"
                value={form.displayName}
                maxLength={100}
                invalid={Boolean(formError)}
                onChange={(event) =>
                  setForm((current) => ({ ...current, displayName: event.target.value }))
                }
                autoFocus
              />
            </Field>
            <div className="profile-modal-actions">
              <Button variant="ghost" type="button" onClick={closeModal} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button variant="primary" type="submit" loading={isSubmitting}>
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </ProfileModal>
      )}

      {activeModal === "email" && (
        <ProfileModal title="Đổi email" onClose={closeModal}>
          <form
            className="profile-modal-content"
            onSubmit={(event) => submitProfileUpdate(event, "email")}
          >
            <Field label="Email" htmlFor="profile-email" error={formError}>
              <Input
                id="profile-email"
                type="email"
                value={form.email}
                maxLength={100}
                invalid={Boolean(formError)}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                autoFocus
              />
            </Field>
            <div className="profile-modal-actions">
              <Button variant="ghost" type="button" onClick={closeModal} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button variant="primary" type="submit" loading={isSubmitting}>
                Lưu thay đổi
              </Button>
            </div>
          </form>
        </ProfileModal>
      )}

      {activeModal === "password" && (
        <ProfileModal title="Đổi mật khẩu" onClose={closeModal}>
          <form className="profile-modal-content" onSubmit={submitPasswordUpdate}>
            <Field label="Mật khẩu mới" htmlFor="profile-password">
              <Input
                id="profile-password"
                type="password"
                value={form.password}
                minLength={PASSWORD_MIN_LENGTH}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                autoFocus
              />
            </Field>
            <Field
              label="Xác nhận mật khẩu"
              htmlFor="profile-confirm-password"
              error={formError}
            >
              <Input
                id="profile-confirm-password"
                type="password"
                value={form.confirmPassword}
                minLength={PASSWORD_MIN_LENGTH}
                invalid={Boolean(formError)}
                onChange={(event) =>
                  setForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
              />
            </Field>
            <div className="profile-modal-actions">
              <Button variant="ghost" type="button" onClick={closeModal} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button variant="primary" type="submit" loading={isSubmitting}>
                Đổi mật khẩu
              </Button>
            </div>
          </form>
        </ProfileModal>
      )}
    </div>
  );
}
