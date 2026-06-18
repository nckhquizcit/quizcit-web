import { useState } from "react";
import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";

export default function AddTheoryModal({ open, onClose, chapter, onSubmit }) {
  const [content, setContent] = useState("");

  if (!chapter) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <FormModalLayout
        title="Thêm lý thuyết"
        subtitle={`Chương: ${chapter.name}`}
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
              Thêm
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