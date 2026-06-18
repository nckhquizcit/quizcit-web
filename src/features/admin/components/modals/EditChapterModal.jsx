import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";

export default function EditChapterModal({ open, onClose, chapter, onSubmit }) {
  const [name, setName] = useState("");

  useEffect(() => {
    if (chapter) setName(chapter.name || "");
  }, [chapter]);

  if (!chapter) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <FormModalLayout
        title="Sửa chương"
        subtitle={`Đang sửa: ${chapter.name}`}
        actions={
          <>
            <button className="cancel-btn" onClick={onClose}>Hủy</button>
            <button
              className="add-btn"
              onClick={() => {
                onSubmit?.({ name });
                setName("");
              }}
            >
              Lưu
            </button>
          </>
        }
      >
        <input
          placeholder="Tên chương"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormModalLayout>
    </Modal>
  );
}