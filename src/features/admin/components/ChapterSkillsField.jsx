import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatScaledThetaValue } from "../../../services/mappers";

const clampRawTheta = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(4, Math.max(-4, n));
};

export default function ChapterSkillsField({ skills = [], value = [], onChange }) {
  const [search, setSearch] = useState("");
  const selectedById = useMemo(
    () => new Map(value.map((item) => [item.skillId, item])),
    [value],
  );
  const filteredSkills = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    if (!keyword) return skills;
    return skills.filter((skill) =>
      `${skill.name || ""} ${skill.skillId || ""}`.toLocaleLowerCase("vi").includes(keyword),
    );
  }, [search, skills]);

  const toggleSkill = (skill, checked) => {
    onChange?.(
      checked
        ? [...value, { skillId: skill.skillId, name: skill.name, requiredTheta: 0 }]
        : value.filter((item) => item.skillId !== skill.skillId),
    );
  };

  const updateTheta = (skillId, requiredTheta) => {
    onChange?.(
      value.map((item) =>
        item.skillId === skillId ? { ...item, requiredTheta: clampRawTheta(requiredTheta) } : item,
      ),
    );
  };

  return (
    <div className="chapter-skills-field">
      <div className="chapter-skills-field__header">
        <div>
          <strong>Kỹ năng giảng dạy & Điều kiện hoàn thành</strong>
          <p>
            Chọn kỹ năng và θ raw tối thiểu (−4…4) cần đạt để hoàn thành chương này và mở khóa chương tiếp theo. Học viên thấy thang 0–4 (raw 0 = 2.00).
          </p>
        </div>
        <span className="chapter-skills-field__count">{value.length} đã chọn</span>
      </div>

      {skills.length > 6 && (
        <label className="chapter-skills-field__search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Tìm kỹ năng..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      )}

      <div className="chapter-skills-field__list">
        {filteredSkills.map((skill) => {
          const selected = selectedById.get(skill.skillId);
          const scaledPreview = selected
            ? formatScaledThetaValue(clampRawTheta(selected.requiredTheta))
            : null;
          return (
            <div className={`chapter-skill-option${selected ? " is-selected" : ""}`} key={skill.skillId}>
              <label className="chapter-skill-option__toggle">
                <input
                  type="checkbox"
                  checked={Boolean(selected)}
                  onChange={(event) => toggleSkill(skill, event.target.checked)}
                />
                <span title={skill.name}>{skill.name}</span>
              </label>
              {selected && (
                <label className="chapter-skill-option__theta">
                  <span>θ raw</span>
                  <input
                    aria-label={`Theta raw yêu cầu ${skill.name}`}
                    type="number"
                    step="0.1"
                    min={-4}
                    max={4}
                    value={selected.requiredTheta}
                    onChange={(event) => updateTheta(skill.skillId, Number(event.target.value))}
                  />
                  <span className="chapter-skill-option__scaled" title="Thang học viên (0–4)">
                    ≈ {scaledPreview}
                  </span>
                </label>
              )}
            </div>
          );
        })}
        {!filteredSkills.length && (
          <div className="chapter-skills-field__empty">
            {skills.length ? "Không tìm thấy kỹ năng phù hợp." : "Chưa có kỹ năng nào trong kho."}
          </div>
        )}
      </div>
    </div>
  );
}
