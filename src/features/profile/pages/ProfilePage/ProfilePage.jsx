import ProfileHeader from "../../components/ProfileHeader/ProfileHeader";
import AchievementCard from "../../components/AchievementCard/AchievementCard";
import { Target, Award, Zap, BookOpen, Flame, Trophy } from "lucide-react";
import "./ProfilePage.css";

export default function ProfilePage() {
  const userData = {
    name: "Nguyễn Văn A",
    username: "huanverified",
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
      <ProfileHeader user={userData} />

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
