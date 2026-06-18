import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";

export default function EditTheoryModal({ open, onClose, theory, onSubmit }) {
  const [content, setContent] = useState("");

  useEffect(() => {
    if (theory) setContent(theory.content || "");
  }, [theory]);

  if (!theory) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <FormModalLayout
        title="Sửa lý thuyết"
        subtitle="Chỉnh sửa nội dung lý thuyết"
        actions={
          <>
            <button className="cancel-btn" onClick={onClose}>Hủy</button>
            <button
              className="add-btn"
              onClick={() => {
                onSubmit?.({ content });
                setContent("");
              }}
            >
              Lưu
            </button>
          </>
        }
      >
        <textarea
          placeholder="Nội dung lý thuyết"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        />
      </FormModalLayout>
    </Modal>
  );
}