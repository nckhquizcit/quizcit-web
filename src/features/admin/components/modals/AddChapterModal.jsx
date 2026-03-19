import Modal from "../ui/Modal";
import FormModalLayout from "../ui/FormModalLayout";

export default function AddChapterModal({ open, onClose, subject }) {
  if (!subject) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <FormModalLayout
        title="Thêm chương mới"
        subtitle={`Thêm chương vào "${subject.name}"`}
        infoBox={
          <>
            <div>
              <b>Môn:</b> {subject.name}
            </div>
            <div>
              <b>Mã:</b> {subject.code}
            </div>
          </>
        }
        actions={
          <>
            <button className="cancel-btn" onClick={onClose}>
              Hủy
            </button>
            <button className="add-btn">Thêm chương</button>
          </>
        }
      >
        <input placeholder="Tên chương" />
      </FormModalLayout>
    </Modal>
  );
}
