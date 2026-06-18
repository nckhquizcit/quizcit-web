import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";

import { useState } from "react";

export default function AddSubjectModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");

  return (
    <Modal open={open} onClose={onClose}>
      <FormModalLayout
        title="Thêm môn học mới"
        subtitle="Nhập thông tin môn học để thêm vào hệ thống"
        actions={
          <>
            <button className="cancel-btn" onClick={onClose}>
              Hủy
            </button>
            <button
              className="add-btn"
              onClick={() => onSubmit?.({ name, courseCode, description })}
            >
              Thêm môn học
            </button>
          </>
        }
      >
        <input placeholder="Tên môn học" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          placeholder="Mã môn học"
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value)}
        />
        <textarea
          placeholder="Mô tả môn học"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FormModalLayout>
    </Modal>
  );
}
