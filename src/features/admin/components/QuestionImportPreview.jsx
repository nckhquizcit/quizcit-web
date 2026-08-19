import { useState } from "react";
import { AlertCircle, CheckCircle2, Search, Trash2 } from "lucide-react";

import { IMPORT_OPTION_KEYS } from "../utils/questionImportParser";
import RichTextView from "../../../components/richtext/RichTextView";
import { toPreviewText } from "../../../components/richtext/richTextUtils";
import {
  filterImportSkills,
  getImportSkillsForChapter,
} from "../utils/questionImportPreviewLogic";
import {
  CUSTOM_DIFFICULTY_KEY,
  DIFFICULTY_PRESETS,
  getDifficultyLabelVi,
  getDifficultyTone,
  resolveDifficultyB,
} from "../utils/difficultyLevels";

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
  onChangeRow,
  onRemoveRow,
  disabled = false,
  allowPlacementEdit = false,
}) {
  const [skillSearchByRow, setSkillSearchByRow] = useState({});
  const [filter, setFilter] = useState("all");

  if (!rows.length) {
    return (
      <div className="question-import-empty">
        <strong>Chưa có câu hỏi để xem trước</strong>
        <span>Dán nội dung hoặc tải file .txt/.csv/.xml rồi bấm Phân tích nội dung.</span>
      </div>
    );
  }

  const indexedRows = rows.map((row, index) => ({ row, index }));
  const visibleRows = indexedRows.filter(({ row }) => {
    if (filter === "errors") return row.errors?.length > 0;
    if (filter === "valid") return !row.errors?.length;
    return true;
  }).sort((left, right) => Number(right.row.errors?.length > 0) - Number(left.row.errors?.length > 0));

  return (
    <>
      <div className="question-import-preview-toolbar" aria-label="Lọc bản xem trước">
        {[
          ["errors", "Cần sửa", rows.filter((row) => row.errors?.length).length],
          ["valid", "Hợp lệ", rows.filter((row) => !row.errors?.length).length],
          ["all", "Tất cả", rows.length],
        ].map(([value, label, count]) => (
          <button
            type="button"
            className={filter === value ? "active" : ""}
            onClick={() => setFilter(value)}
            key={value}
          >
            {label} ({count})
          </button>
        ))}
      </div>
      <div className="question-import-preview-list">
      {visibleRows.map(({ row, index }) => {
        const hasError = row.errors?.length > 0;
        const subjectName = getNameById(subjects, row.subjectId, "Chưa chọn môn");
        const chapterName = getNameById(chapters, row.chapterId, "Chưa chọn chương");
        const rowSkills = row.skills || [];
        const chapterSkills = getImportSkillsForChapter(chapters, row.chapterId);
        const skillNames = getSkillNames(chapterSkills, rowSkills.map((skill) => skill.skillId));
        const skillSearch = skillSearchByRow[row.id] || "";
        const filteredSkills = filterImportSkills(chapterSkills, skillSearch);

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

        const rowChapters = chapters.filter(
          (chapter) => String(chapter.subjectId) === String(row.subjectId),
        );

        return (
          <details
            className={hasError ? "question-import-card has-error" : "question-import-card"}
            key={row.id}
            open={hasError}
          >
            <summary className="question-import-card__summary">
              <span className="bank-question-index">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>
                  {row.contentFormat === "blocknote"
                    ? toPreviewText(row.content, "blocknote")
                    : row.content || `Dòng ${row.sourceLine || index + 1} chưa có nội dung`}
                </strong>
                <span>
                  Đáp án {row.correctKey || "?"} · {subjectName} · {chapterName}
                </span>
              </div>
              <span className={`difficulty-pill ${getDifficultyTone(row.difficultyB)}`}>
                {getDifficultyLabelVi(row.difficultyB)}
              </span>
              <span className={hasError ? "import-status-pill error" : "import-status-pill ok"}>
                {hasError ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                {hasError ? "Cần sửa" : "Hợp lệ"}
              </span>
              <span className="adm2-link-arrow question-import-edit-label">Sửa</span>
            </summary>
            <div className="question-import-card__body">
              <div className="question-import-card__actions">
                <button
                  type="button"
                  aria-label={`Xóa câu ${index + 1}`}
                  onClick={() => onRemoveRow?.(row.id)}
                  disabled={disabled}
                >
                  <Trash2 size={16} />
                  Xóa câu
                </button>
              </div>

            {row.contentFormat === "blocknote" ? (
              <div className="form-field full">
                <span>Nội dung câu hỏi *</span>
                <div className="question-import-rich-preview">
                  <RichTextView content={row.content} contentFormat="blocknote" />
                </div>
              </div>
            ) : <label className="form-field full">
              <span>Nội dung câu hỏi *</span>
              <textarea
                value={row.content}
                onChange={(event) => onChangeRow?.(row.id, { content: event.target.value })}
                disabled={disabled}
                className={!row.content?.trim() ? "invalid" : ""}
              />
            </label>}

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
                    {row.contentFormat === "blocknote" ? (
                      <div className="question-import-option-rich">
                        <RichTextView content={option.content} contentFormat="blocknote" variant="inline" />
                      </div>
                    ) : (
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
                    )}
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
              {allowPlacementEdit && (
                <>
                  <label className="form-field">
                    <span>Môn học *</span>
                    <select
                      value={row.subjectId}
                      onChange={(event) =>
                        onChangeRow?.(row.id, { subjectId: event.target.value, chapterId: "" })
                      }
                      disabled={disabled}
                    >
                      <option value="">Chọn môn học</option>
                      {subjects.map((subject) => (
                        <option value={subject.subjectId} key={subject.subjectId}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Chương *</span>
                    <select
                      value={row.chapterId}
                      onChange={(event) => onChangeRow?.(row.id, { chapterId: event.target.value })}
                      disabled={disabled || !row.subjectId}
                    >
                      <option value="">Chọn chương</option>
                      {rowChapters.map((chapter) => (
                        <option value={chapter.chapterId} key={chapter.chapterId}>
                          {chapter.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}

              <label className="form-field">
                <span>Độ khó</span>
                <select
                  value={row.difficulty}
                  onChange={(event) => {
                    const nextKey = event.target.value;
                    onChangeRow?.(row.id, {
                      difficulty: nextKey,
                      difficultyB:
                        nextKey === CUSTOM_DIFFICULTY_KEY
                          ? Number(row.difficultyB ?? 0)
                          : resolveDifficultyB(nextKey),
                    });
                  }}
                  disabled={disabled}
                >
                  {DIFFICULTY_PRESETS.map((preset) => (
                    <option key={preset.key} value={preset.key}>
                      {preset.label}
                    </option>
                  ))}
                  <option value={CUSTOM_DIFFICULTY_KEY}>Tùy chỉnh</option>
                </select>
                {row.difficulty === CUSTOM_DIFFICULTY_KEY && (
                  <input
                    type="number"
                    step="0.1"
                    value={row.difficultyB ?? ""}
                    onChange={(event) =>
                      onChangeRow?.(row.id, {
                        difficulty: CUSTOM_DIFFICULTY_KEY,
                        difficultyB: event.target.value,
                      })
                    }
                    disabled={disabled}
                    placeholder="Ví dụ: -1.2"
                    aria-label="Độ khó tùy chỉnh"
                  />
                )}
              </label>

              {row.contentFormat === "blocknote" ? (
                <div className="form-field">
                  <span>Giải thích</span>
                  <div className="question-import-rich-preview question-import-rich-preview--compact">
                    {row.explanation ? (
                      <RichTextView content={row.explanation} contentFormat="blocknote" />
                    ) : (
                      <span className="question-import-empty-text">Có thể để trống</span>
                    )}
                  </div>
                </div>
              ) : (
                <label className="form-field">
                  <span>Giải thích</span>
                  <input
                    value={row.explanation}
                    placeholder="Có thể để trống"
                    onChange={(event) => onChangeRow?.(row.id, { explanation: event.target.value })}
                    disabled={disabled}
                  />
                </label>
              )}
            </div>

            <div className="question-import-meta">
              {row.moodleType && <span><b>Định dạng</b>{row.moodleName || row.moodleType}</span>}
              {row.moodleCategory && <span><b>Category</b>{row.moodleCategory}</span>}
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
                {!row.chapterId && <span>Chọn chương để xem kỹ năng</span>}
                {row.chapterId && !chapterSkills.length && <span>Chương này chưa gán kỹ năng</span>}
                {chapterSkills.length > 0 && !filteredSkills.length && <span>Không có kỹ năng phù hợp</span>}
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
            </div>
          </details>
        );
      })}
      {!visibleRows.length && (
        <div className="question-import-empty compact">
          <strong>Không có câu hỏi trong nhóm này</strong>
          <span>Chọn bộ lọc khác để xem các câu còn lại.</span>
        </div>
      )}
      </div>
    </>
  );
}
