import { useEffect, useMemo, useState } from "react";
import { FileUp, Upload } from "lucide-react";

import Modal from "../ui/Modal";

const quizTypeOptions = [
  { label: "Cố định", value: "FIXED" },
  { label: "Tự động", value: "GENERATED" },
];

export default function AddQuizModal({
  open,
  onClose,
  mode = "create",
  initialQuiz,
  onSubmit,
  subjects = [],
  chapters = [],
}) {
  const isEdit = mode === "edit";
  const [activeTab, setActiveTab] = useState("manual");
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.subjectId);
  const [chapterId, setChapterId] = useState("");
  const [type, setType] = useState("FIXED");
  const [duration, setDuration] = useState("");
  const [totalQuestion, setTotalQuestion] = useState(0);

  const availableChapters = useMemo(
    () => chapters.filter((chapter) => chapter.subjectId === subjectId),
    [chapters, subjectId],
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;

    const fallbackSubjectId = initialQuiz?.subjectId || subjects[0]?.subjectId;
    const fallbackChapters = chapters.filter((chapter) => chapter.subjectId === fallbackSubjectId);
    const fallbackChapterId =
      initialQuiz?.chapterId || fallbackChapters[0]?.chapterId || "";

    setActiveTab("manual");
    setName(initialQuiz?.name || "");
    setSubjectId(fallbackSubjectId);
    setChapterId(fallbackChapterId);
    setType(initialQuiz?.type || "FIXED");
    setDuration(initialQuiz?.duration || "");
    setTotalQuestion(initialQuiz?.totalQuestion || 0);
  }, [chapters, initialQuiz, open, subjects]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSubjectChange = (nextSubjectId) => {
    const nextChapters = chapters.filter((chapter) => chapter.subjectId === nextSubjectId);
    setSubjectId(nextSubjectId);
    setChapterId(nextChapters[0]?.chapterId || "");
  };

  const handleSubmit = () => {
    onSubmit?.({
      name,
      subjectId,
      chapterId,
      type,
      duration,
      totalQuestion,
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="quiz-form-modal">
        <div className="quiz-form-header">
          <h2>{isEdit ? "Sửa đề thi" : "Thêm đề thi mới"}</h2>
        </div>

        <div className="quiz-tabs">
          <button
            className={activeTab === "manual" ? "active" : ""}
            onClick={() => setActiveTab("manual")}
          >
            Tạo thủ công
          </button>
          <button
            className={activeTab === "import" ? "active" : ""}
            onClick={() => setActiveTab("import")}
          >
            Import từ file
          </button>
        </div>

        <div className="quiz-form-body">
          {activeTab === "manual" ? (
            <>
              <label className="quiz-field full">
                <span>Tên đề thi *</span>
                <input
                  value={name}
                  placeholder="Nhập tên đề thi..."
                  onChange={(event) => setName(event.target.value)}
                />
              </label>

              <div className="quiz-two-column">
                <label className="quiz-field">
                  <span>Môn học *</span>
                  <select
                    value={subjectId}
                    onChange={(event) => handleSubjectChange(event.target.value)}
                  >
                    {subjects.map((subject) => (
                      <option value={subject.subjectId} key={subject.subjectId}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="quiz-field">
                  <span>Chương *</span>
                  <select value={chapterId} onChange={(event) => setChapterId(event.target.value)}>
                    {availableChapters.map((chapter) => (
                      <option value={chapter.chapterId} key={chapter.chapterId}>
                        {chapter.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="quiz-two-column">
                <label className="quiz-field">
                  <span>Loại đề thi *</span>
                  <select value={type} onChange={(event) => setType(event.target.value)}>
                    {quizTypeOptions.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="quiz-field">
                  <span>Thời gian (phút) *</span>
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    placeholder="Nhập thời gian làm bài..."
                    onChange={(event) => setDuration(event.target.value)}
                  />
                </label>
              </div>

              <label className="quiz-field full">
                <span>Tổng số câu hỏi</span>
                <input
                  type="number"
                  min="1"
                  value={totalQuestion}
                  onChange={(event) => setTotalQuestion(event.target.value)}
                />
              </label>
            </>
          ) : (
            <>
              <div className="quiz-import-zone">
                <FileUp size={58} />
                <strong>Import đề thi từ file JSON</strong>
                <span>Tải lên file JSON chứa thông tin đề thi và danh sách câu hỏi</span>
                <label>
                  <Upload size={18} />
                  Chọn file
                  <input type="file" accept=".json" />
                </label>
              </div>

              <div className="quiz-json-sample">
                <strong>Định dạng file JSON mẫu:</strong>
                <pre>{`{
  "name": "Kiểm tra Chương 2",
  "subject_id": "s1",
  "chapter_id": "c2",
  "type": "FIXED",
  "duration": 1200,
  "questions": ["q1", "q2", "q3"]
}`}</pre>
              </div>
            </>
          )}
        </div>

        <div className="question-modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Hủy
          </button>
          <button className="add-btn" onClick={handleSubmit}>
            {isEdit ? "Lưu thay đổi" : "Thêm đề thi"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
