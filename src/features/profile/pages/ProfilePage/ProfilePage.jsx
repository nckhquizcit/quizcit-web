import { useMemo, useState } from "react";
import ProfileHeader from "../../components/ProfileHeader/ProfileHeader";
import AchievementCard from "../../components/AchievementCard/AchievementCard";
import { Target, Award, Zap, BookOpen, Flame, Trophy } from "lucide-react";
import { changePassword, updateDisplayName } from "../../../../services/userService";
import Modal from "../../../admin/components/ui/Modal";
import "./ProfilePage.css";

export default function ProfilePage() {
  const currentUser = useMemo(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  }, []);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [password, setPassword] = useState("");
  const [openNameModal, setOpenNameModal] = useState(false);
  const [openEmailModal, setOpenEmailModal] = useState(false);
  const [openPasswordModal, setOpenPasswordModal] = useState(false);
  const [message, setMessage] = useState("");
  const userData = {
    name: displayName || currentUser?.username || "Người dùng",
    username: currentUser?.username || "unknown",
    xp: 725,
    completedQuizzes: 4,
    achievementsCount: 1,
  };

  const achievements = [
    {
      id: 1,
      title: "Bước đầu tiên",
      description: "Hoàn thành bài kiểm tra đầu tiên của bạn",
      icon: Target,
      progress: 1,
      total: 1,
      rank: "Đồng",
      isActive: true,
      isLocked: false,
    },
    {
      id: 2,
      title: "Học viên tập sự",
      description: "Hoàn thành 10 bài kiểm tra",
      icon: BookOpen,
      progress: 4,
      total: 10,
      rank: "Bạc",
      isLocked: true,
    },
    {
      id: 3,
      title: "Bậc thầy Quiz",
      description: "Hoàn thành 100 bài kiểm tra",
      icon: Trophy,
      progress: 4,
      total: 100,
      rank: "Vàng",
      isLocked: true,
    },
    // Thêm các thành tích khác...
  ];

  return (
    <div className="profile-page-wrapper">
      <ProfileHeader
        user={userData}
        onOpenChangeName={() => setOpenNameModal(true)}
        onOpenChangeEmail={() => setOpenEmailModal(true)}
        onOpenChangePassword={() => setOpenPasswordModal(true)}
      />
      {message && <p className="profile-update-message">{message}</p>}

      <Modal open={openNameModal} onClose={() => setOpenNameModal(false)}>
        <div className="profile-modal-content">
          <h3>Đổi tên hiển thị</h3>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Tên hiển thị mới"
          />
          <button
            className="profile-modal-submit"
            type="button"
            onClick={async () => {
              if (!currentUser?.userId || !displayName.trim()) return;
              await updateDisplayName(currentUser.userId, displayName.trim());
              localStorage.setItem(
                "user",
                JSON.stringify({ ...currentUser, displayName: displayName.trim() }),
              );
              setMessage("Đã cập nhật tên hiển thị.");
              setOpenNameModal(false);
            }}
          >
            Lưu
          </button>
        </div>
      </Modal>

      <Modal open={openEmailModal} onClose={() => setOpenEmailModal(false)}>
        <div className="profile-modal-content">
          <h3>Đổi email</h3>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email mới"
          />
          <button
            className="profile-modal-submit"
            type="button"
            onClick={() => {
              setMessage("Backend hiện chưa hỗ trợ API đổi email.");
              setOpenEmailModal(false);
            }}
          >
            Lưu
          </button>
        </div>
      </Modal>

      <Modal open={openPasswordModal} onClose={() => setOpenPasswordModal(false)}>
        <div className="profile-modal-content">
          <h3>Đổi mật khẩu</h3>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mật khẩu mới"
          />
          <button
            className="profile-modal-submit"
            type="button"
            onClick={async () => {
              if (!currentUser?.userId || !password) return;
              await changePassword(currentUser.userId, password);
              setPassword("");
              setMessage("Đã cập nhật mật khẩu.");
              setOpenPasswordModal(false);
            }}
          >
            Lưu
          </button>
        </div>
      </Modal>

      <div className="achievements-section">
        <div className="section-header">
          <div className="title-group">
            <h3 className="section-title">🏆 Thành tích</h3>
            <p className="section-subtitle">
              Mở khóa thành tích bằng cách hoàn thành các thử thách
            </p>
          </div>
          <div className="badge-count">1/8</div>
        </div>

        <div className="achievements-grid">
          {achievements.map((item) => (
            <AchievementCard key={item.id} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}
