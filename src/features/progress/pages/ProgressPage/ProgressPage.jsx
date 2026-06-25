import { useEffect, useMemo, useState } from "react";
import { getAverageAbility, getAbilityHistories, getUserSkillAbilities } from "../../../../services/progressService";
import { getSkills } from "../../../../services/skillService";
import { getStoredUser, getErrorMessage } from "../../../../services/apiClient";
import "./ProgressPage.css";

export default function ProgressPage() {
  const [abilities, setAbilities] = useState([]);
  const [histories, setHistories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [averageAbility, setAverageAbility] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useMemo(() => getStoredUser(), []);

  useEffect(() => {
    let alive = true;

    async function loadProgress() {
      if (!user?.userId) return;
      try {
        setLoading(true);
        setError("");
        const [abilityRows, historyRows, skillRows, average] = await Promise.allSettled([
          getUserSkillAbilities(user.userId),
          getAbilityHistories(user.userId),
          getSkills(),
          getAverageAbility(user.userId),
        ]);

        if (!alive) return;
        setAbilities(abilityRows.status === "fulfilled" ? abilityRows.value : []);
        setHistories(historyRows.status === "fulfilled" ? historyRows.value : []);
        setSkills(skillRows.status === "fulfilled" ? skillRows.value : []);
        setAverageAbility(average.status === "fulfilled" ? average.value : 0);
      } catch (loadError) {
        if (alive) setError(getErrorMessage(loadError, "Không thể tải tiến độ học tập."));
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadProgress();
    return () => {
      alive = false;
    };
  }, [user?.userId]);

  const skillNameById = useMemo(
    () => new Map(skills.map((skill) => [skill.skillId, skill.name])),
    [skills],
  );

  if (loading) {
    return <div className="progress-page-state">Đang tải tiến độ...</div>;
  }

  if (error) {
    return (
      <div className="progress-page-state">
        <p>{error}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="progress-page">
      <header className="progress-header">
        <div>
          <p className="progress-eyebrow">Tiến độ học tập</p>
          <h1>Năng lực theo kỹ năng</h1>
        </div>
        <div className="progress-score">
          <span>Theta trung bình</span>
          <strong>{averageAbility.toFixed(2)}</strong>
        </div>
      </header>

      {abilities.length === 0 ? (
        <section className="progress-empty">
          <h2>Chưa có dữ liệu năng lực</h2>
          <p>Hoàn thành một bài quiz để hệ thống cập nhật theta theo kỹ năng.</p>
        </section>
      ) : (
        <section className="progress-grid">
          {abilities.map((ability) => (
            <article className="progress-card" key={ability.id || ability.skillId}>
              <span>{skillNameById.get(ability.skillId) || ability.skillId}</span>
              <strong>{ability.theta.toFixed(2)}</strong>
              <small>Sai số: {ability.standardError ?? "—"}</small>
            </article>
          ))}
        </section>
      )}

      <section className="progress-history">
        <h2>Lịch sử cập nhật</h2>
        {histories.length === 0 ? (
          <p className="progress-muted">Chưa có lịch sử theta cho tài khoản này.</p>
        ) : (
          <div className="progress-history-list">
            {histories.slice(0, 12).map((item) => (
              <div className="progress-history-item" key={item.id}>
                <span>{skillNameById.get(item.skillId) || item.skillId}</span>
                <strong>{item.theta.toFixed(2)}</strong>
                <small>
                  Thay đổi {item.delta.toFixed(2)} {item.createdAt ? `- ${item.createdAt}` : ""}
                </small>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
