import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../components/AdminPageHeader";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import { getSubjectById, updateSubject } from "../../../services/contentService";
import { getErrorMessage } from "../../../services/apiClient";
import { useToast } from "../../../components/ui/Toast/Toast";

export default function AdminSubjectEdit() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const returnPath = "/admin/subjects";

  useEffect(() => {
    getSubjectById(subjectId).then(setForm).catch((loadError) => setError(getErrorMessage(loadError, "Không thể tải môn học.")));
  }, [subjectId]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const save = async (event) => {
    event.preventDefault();
    try {
      setSaving(true); setError("");
      await updateSubject(subjectId, { ...form, displayOrder: Number(form.displayOrder) });
      toast.success("Cập nhật môn học thành công.");
      navigate(returnPath);
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Không thể cập nhật môn học."));
    } finally { setSaving(false); }
  };

  return <>
    <AdminPageHeader title="Chỉnh sửa môn học" subtitle={form?.name || "Đang tải thông tin..."} icon={<BookOpen size={22} />} backHref={returnPath} />
    <div className="admin-section-card admin-form-page">
      {error && <ErrorState description={error} />}
      {!form && !error && <div className="admin-page-state">Đang tải môn học...</div>}
      {form && <form className="standalone-edit-form" onSubmit={save}>
        <label className="quiz-field"><span>Tên môn học</span><input value={form.name} onChange={(e) => setField("name", e.target.value)} required /></label>
        <label className="quiz-field"><span>Mã môn học</span><input value={form.courseCode} onChange={(e) => setField("courseCode", e.target.value)} required /></label>
        <label className="quiz-field"><span>Mô tả</span><textarea rows="5" value={form.description || ""} onChange={(e) => setField("description", e.target.value)} /></label>
        <label className="quiz-field"><span>Thứ tự hiển thị</span><input type="number" min="1" value={form.displayOrder} onChange={(e) => setField("displayOrder", e.target.value)} required /></label>
        <label className="subject-visibility-checkbox"><input type="checkbox" checked={!form.visible} onChange={(e) => setField("visible", !e.target.checked)} /><span><strong>Ẩn môn học</strong><small>Người dùng thường sẽ không thể xem môn học và nội dung liên quan.</small></span></label>
        <div className="modal-footer"><button type="button" className="cancel-btn" onClick={() => navigate(returnPath)}>Hủy</button><button className="add-btn" disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</button></div>
      </form>}
    </div>
  </>;
}
