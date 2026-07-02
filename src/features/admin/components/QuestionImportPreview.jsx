import { useState } from "react";
import { AlertCircle, CheckCircle2, Search, Trash2 } from "lucide-react";

import { IMPORT_OPTION_KEYS } from "../utils/questionImportParser";
import { filterImportSkills } from "../utils/questionImportPreviewLogic";

const getNameById = (items = [], id, fallback) => {
  if (!id) return fallback;

  const matchedItem = items.find((item) =>
    [item?.subjectId, item?.chapterId, item?.skillId, item?.id]
      .filter((itemId) => itemId !== undefined && itemId !== null)
      .map(String)
      .includes(String(id)),
  );
  return matchedItem?.name || fallback;
};

const getSkillNames = (skills = [], skillIds = []) => {
  if (!skillIds.length) return "Chưa chọn";

  return skillIds
    .map((skillId) => getNameById(skills, skillId, "Kỹ năng không rõ"))
    .join(", ");
};

const normalizeId = (value) => (value === undefined || value === null ? "" : String(value));

const ensureSinglePrimarySkill = (rowSkills = []) => {
  if (!rowSkills.length) return [];

  const primaryIndex = rowSkills.findIndex((skill) => skill.primary);
  const safePrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

  return rowSkills.map((skill, index) => ({
    ...skill,
    primary: index === safePrimaryIndex,
  }));
};

export default function QuestionImportPreview({
  rows = [],
  subjects = [],
  chapters = [],
  skills = [],
  onChangeRow,
  onRemoveRow,
  disabled = false,
}) {
  const [skillSearchByRow, setSkillSearchByRow] = useState({});

  if (!rows.length) {
    return (
      <div className="question-import-empty">
        <strong>Chưa có câu hỏi để xem trước</strong>
        <span>Dán nội dung hoặc tải file .txt/.csv rồi bấm Parse dữ liệu.</span>
      </div>
    );
  }

  return (
    <div className="question-import-preview-list">
      {rows.map((row, index) => {
        const hasError = row.errors?.length > 0;
        const subjectName = getNameById(subjects, row.subjectId, "Chưa chọn môn");
        const chapterName = getNameById(chapters, row.chapterId, "Chưa chọn chương");
        const rowSkills = row.skills || [];
        const skillNames = getSkillNames(skills, rowSkills.map((skill) => skill.skillId));
        const skillSearch = skillSearchByRow[row.id] || "";
        const filteredSkills = filterImportSkills(skills, skillSearch);

        const handleSkillToggle = (skill) => {
          const skillId = normalizeId(skill.skillId || skill.id);
          const exists = rowSkills.some((item) => normalizeId(item.skillId) === skillId);
          const nextSkills = exists
            ? rowSkills.filter((item) => normalizeId(item.skillId) !== skillId)
            : [
                ...rowSkills,
                {
                  skillId,
                  name: skill.name,
                  weight: rowSkills.length === 0 ? "1" : "0",
                  primary: rowSkills.length === 0,
                },
              ];

          onChangeRow?.(row.id, { skills: ensureSinglePrimarySkill(nextSkills) });
        };

        const handlePrimarySkillChange = (skillId) => {
          onChangeRow?.(row.id, {
            skills: rowSkills.map((skill) => ({
              ...skill,
              primary: normalizeId(skill.skillId) === normalizeId(skillId),
            })),
          });
        };

        const handleSkillWeightChange = (skillId, weight) => {
          onChangeRow?.(row.id, {
            skills: rowSkills.map((skill) =>
              normalizeId(skill.skillId) === normalizeId(skillId)
                ? { ...skill, weight }
                : skill,
            ),
          });
        };

        return (
          <article
            className={hasError ? "question-import-card has-error" : "question-import-card"}
            key={row.id}
          >
            <div className="question-import-card__head">
              <div className="question-import-card__title">
                <strong>Câu {index + 1}</strong>
                <span>Dòng {row.sourceLine || index + 1}</span>
              </div>
              <div className="question-import-card__actions">
                <span className={hasError ? "import-status-pill error" : "import-status-pill ok"}>
                  {hasError ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                  {hasError ? "Cần sửa" : "Hợp lệ"}
                </span>
                <button
                  type="button"
                  aria-label={`Xóa câu ${index + 1}`}
                  onClick={() => onRemoveRow?.(row.id)}
                  disabled={disabled}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <label className="form-field full">
              <span>Nội dung câu hỏi *</span>
              <textarea
                value={row.content}
                onChange={(event) => onChangeRow?.(row.id, { content: event.target.value })}
                disabled={disabled}
                className={!row.content?.trim() ? "invalid" : ""}
              />
            </label>

            <div className="question-import-options">
              {IMPORT_OPTION_KEYS.map((key) => {
                const option = row.options.find((item) => item.key === key) || { key, content: "" };
                const isCorrect = row.correctKey === key;

                return (
                  <label
                    className={isCorrect ? "question-import-option is-correct" : "question-import-option"}
                    key={`${row.id}-${key}`}
                  >
                    <span>{key}</span>
                    <input
                      value={option.content}
                      placeholder={`Đáp án ${key}`}
                      onChange={(event) =>
                        onChangeRow?.(row.id, {
                          options: row.options.map((item) =>
                            item.key === key ? { ...item, content: event.target.value } : item,
                          ),
                        })
                      }
                      disabled={disabled}
                    />
                    <input
                      type="radio"
                      name={`correct-${row.id}`}
                      checked={isCorrect}
                      onChange={() => onChangeRow?.(row.id, { correctKey: key })}
                      disabled={disabled}
                      aria-label={`Đặt đáp án ${key} là đáp án đúng`}
                    />
                  </label>
                );
              })}
            </div>

            <div className="question-import-row-controls">
              <label className="form-field">
                <span>Độ khó</span>
                <select
                  value={row.difficulty}
                  onChange={(event) => onChangeRow?.(row.id, { difficulty: event.target.value })}
                  disabled={disabled}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </label>

              <label className="form-field">
                <span>Giải thích</span>
                <input
                  value={row.explanation}
                  placeholder="Có thể để trống"
                  onChange={(event) => onChangeRow?.(row.id, { explanation: event.target.value })}
                  disabled={disabled}
                />
              </label>
            </div>

            <div className="question-import-meta">
              <span>
                <b>Môn</b>
                {subjectName}
              </span>
              <span>
                <b>Chương</b>
                {chapterName}
              </span>
              <span>
                <b>Kỹ năng</b>
                {skillNames}
              </span>
            </div>

            <div className="question-import-skill-editor">
              <div className="field-inline-header">
                <span>Kỹ năng của câu này</span>
                <span className="skill-hint">Tổng trọng số cần bằng 1.</span>
              </div>
              <div className="mini-search import-skill-search">
                <Search size={18} />
                <input
                  placeholder="Tìm kỹ năng..."
                  value={skillSearch}
                  onChange={(event) =>
                    setSkillSearchByRow((current) => ({
                      ...current,
                      [row.id]: event.target.value,
                    }))
                  }
                  disabled={disabled}
                />
              </div>
              <div className="choice-list import-skill-choice-list">
                {filteredSkills.map((skill) => {
                  const skillId = normalizeId(skill.skillId || skill.id);
                  const isSelected = rowSkills.some((item) => normalizeId(item.skillId) === skillId);

                  return (
                    <button
                      type="button"
                      className={isSelected ? "selected" : ""}
                      onClick={() => handleSkillToggle(skill)}
                      key={`${row.id}-${skillId}`}
                      disabled={disabled}
                    >
                      <span />
                      {skill.name}
                    </button>
                  );
                })}
                {!skills.length && <span>Chưa tải được danh sách kỹ năng</span>}
                {skills.length > 0 && !filteredSkills.length && <span>Không có kỹ năng phù hợp</span>}
              </div>

              {rowSkills.length > 0 && (
                <div className="selected-skill-list">
                  {rowSkills.map((skill) => (
                    <div className="selected-skill-row" key={`${row.id}-${skill.skillId}`}>
                      <strong>{skill.name}</strong>
                      <button
                        className={skill.primary ? "primary-skill-btn active" : "primary-skill-btn"}
                        type="button"
                        onClick={() => handlePrimarySkillChange(skill.skillId)}
                        disabled={disabled}
                      >
                        {skill.primary ? "Kỹ năng chính" : "Đặt làm chính"}
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={skill.weight}
                        onChange={(event) => handleSkillWeightChange(skill.skillId, event.target.value)}
                        disabled={disabled}
                        placeholder="0 đến 1"
                      />
                      <button type="button" onClick={() => handleSkillToggle(skill)} disabled={disabled}>
                        Bỏ chọn
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(row.errors?.length > 0 || row.warnings?.length > 0) && (
              <div className="question-import-messages">
                {row.errors?.map((error) => (
                  <span className="error" key={error}>
                    {error}
                  </span>
                ))}
                {row.warnings?.map((warning) => (
                  <span className="warning" key={warning}>
                    {warning}
                  </span>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
