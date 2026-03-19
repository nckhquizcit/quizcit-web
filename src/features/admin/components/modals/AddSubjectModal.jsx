import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";

export default function AddSubjectModal({ open, onClose }) {
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
            <button className="add-btn">Thêm môn học</button>
          </>
        }
      >
        <input placeholder="Tên môn học" />
        <input placeholder="Mã môn học" />
        <textarea placeholder="Mô tả môn học" rows={4} />
      </FormModalLayout>
    </Modal>
  );
}
