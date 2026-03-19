import { useState } from "react";
import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";

export default function AddQuestionModal({ open, onClose, subject, chapter }) {
  const [question, setQuestion] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [answers, setAnswers] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(null);

  const handleAnswerChange = (index, value) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <FormModalLayout
        title="Thêm câu hỏi mới"
        subtitle={`Thêm vào "${chapter?.name}"`}
        infoBox={
          <>
            <div>
              <b>Môn:</b> {subject?.name}
            </div>
            <div>
              <b>Chương:</b> {chapter?.name}
            </div>
          </>
        }
        actions={
          <>
            <button className="cancel-btn" onClick={onClose}>
              Hủy
            </button>
            <button className="add-btn">Thêm câu hỏi</button>
          </>
        }
      >
        {/* ===== QUESTION ===== */}
        <textarea
          placeholder="Nhập nội dung câu hỏi..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        {/* ===== DIFFICULTY ===== */}
        <input
          placeholder="Độ khó (1 - 10)"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        />

        {/* ===== ANSWERS ===== */}
        {answers.map((ans, index) => (
          <div
            key={index}
            className={`answer-item ${correctIndex === index ? "correct" : ""}`}
          >
            <input
              placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
              value={ans}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
            />

            <button
              type="button"
              className="correct-btn"
              onClick={() => setCorrectIndex(index)}
            >
              {correctIndex === index ? "✓ Đúng" : "Chọn"}
            </button>
          </div>
        ))}
      </FormModalLayout>
    </Modal>
  );
}
