import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getUserSkillAbilities } from "../../../../services/progressService";
import { getSkills } from "../../../../services/skillService";
import { getErrorMessage, getStoredUser } from "../../../../services/apiClient";
import { EmptyState, ErrorState, SkeletonCard } from "../../../../components/ui";
import SkillTile from "../../components/SkillTile/SkillTile";
import {
  buildSkillMaps,
  getSkillDisplayName,
  normalizeSkillId,
} from "../../utils/skillProgress";
import "./SkillsPage.css";

const INVALID_SESSION_MESSAGE = "Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.";
const LOAD_ERROR_MESSAGE = "Không thể tải danh sách kỹ năng.";

export default function SkillsPage() {
  const [abilities, setAbilities] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useMemo(() => getStoredUser(), []);
  const loadIdRef = useRef(0);

  // Tách phần tải dữ liệu thành hàm gọi lại được: effect ban đầu và nút "Thử lại" dùng chung.
  const loadSkills = useCallback(async () => {
    const loadId = ++loadIdRef.current;
    const isCurrent = () => loadIdRef.current === loadId;

    if (!user?.userId) {
      setError(INVALID_SESSION_MESSAGE);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const [abilityRows, skillRows] = await Promise.allSettled([
        getUserSkillAbilities(user.userId),
        getSkills(),
      ]);

      if (!isCurrent()) return;

      if (abilityRows.status === "rejected") {
        setError(getErrorMessage(abilityRows.reason, LOAD_ERROR_MESSAGE));
        return;
      }

      setAbilities(abilityRows.value || []);
      setSkills(skillRows.status === "fulfilled" ? skillRows.value : []);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    loadSkills();
    return () => {
      loadIdRef.current += 1;
    };
  }, [loadSkills]);

  const { nameById, descriptionById } = useMemo(() => buildSkillMaps(skills), [skills]);

  return (
    <div className="skills-page">
      <Link className="skills-page__back" to="/app/progress">
        <ArrowLeft size={16} />
        Tiến độ
      </Link>

      <header className="skills-page__header">
        <h1>Tất cả kỹ năng</h1>
        <p>Chọn một kỹ năng để xem diễn biến năng lực và lịch sử cập nhật chi tiết.</p>
      </header>

      {loading ? (
        <SkeletonCard lines={5} />
      ) : error ? (
        <ErrorState description={error} onRetry={loadSkills} />
      ) : abilities.length === 0 ? (
        <EmptyState
          title="Chưa có dữ liệu năng lực"
          description="Hoàn thành một bài kiểm tra để hệ thống cập nhật năng lực theo kỹ năng."
        />
      ) : (
        <div className="skills-page__grid">
          {abilities.map((ability) => {
            const skillId = normalizeSkillId(ability.skillId);
            return (
              <SkillTile
                key={ability.id || skillId}
                skillId={skillId}
                name={getSkillDisplayName(nameById, skillId, ability.name)}
                description={descriptionById.get(skillId) || ""}
                theta={ability.theta}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
