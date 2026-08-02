import { useMemo, useState } from "react";
import { Search } from "lucide-react";

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
        item.skillId === skillId ? { ...item, requiredTheta } : item,
      ),
    );
  };

  return (
    <div className="chapter-skills-field">
      <div className="chapter-skills-field__header">
        <div>
          <strong>Kỹ năng yêu cầu</strong>
          <p>Chọn kỹ năng và mức theta tối thiểu để mở khóa chương.</p>
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
                  <span>Theta</span>
                  <input
                    aria-label={`Theta yêu cầu ${skill.name}`}
                    type="number"
                    step="0.1"
                    value={selected.requiredTheta}
                    onChange={(event) => updateTheta(skill.skillId, Number(event.target.value))}
                  />
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
