import { Trash2 } from "lucide-react";

import { IMPORT_OPTION_KEYS } from "../utils/questionImportParser";

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

export default function QuestionImportPreview({
  rows = [],
  subjects = [],
  chapters = [],
  skills = [],
  onChangeRow,
  onRemoveRow,
  disabled = false,
}) {
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
        const skillNames = getSkillNames(skills, row.skillIds);

        return (
          <article
            className={hasError ? "question-import-card has-error" : "question-import-card"}
            key={row.id}
          >
            <div className="question-import-card__head">
              <div>
                <strong>Câu {index + 1}</strong>
                <span>Dòng nguồn: {row.sourceLine || index + 1}</span>
              </div>
              <div className="question-import-card__actions">
                <span className={hasError ? "import-status-pill error" : "import-status-pill ok"}>
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
              <span>Môn: {subjectName}</span>
              <span>Chương: {chapterName}</span>
              <span>Kỹ năng: {skillNames}</span>
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
