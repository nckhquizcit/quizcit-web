import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../components/AdminPageHeader";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import { getChapterById, updateChapter } from "../../../services/contentService";
import { getErrorMessage } from "../../../services/apiClient";
import { useToast } from "../../../components/ui/Toast/Toast";

export default function AdminChapterEdit() {
  const { subjectId, chapterId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const returnPath = `/admin/subjects/${subjectId}/chapters`;

  useEffect(() => {
    getChapterById(chapterId).then(setForm).catch((loadError) => setError(getErrorMessage(loadError, "Không thể tải chương.")));
  }, [chapterId]);

  const save = async (event) => {
    event.preventDefault();
    try {
      setSaving(true); setError("");
      await updateChapter(chapterId, { name: form.name, displayOrder: Number(form.displayOrder) });
      toast.success("Cập nhật chương thành công.");
      navigate(returnPath);
    } catch (saveError) { setError(getErrorMessage(saveError, "Không thể cập nhật chương.")); }
    finally { setSaving(false); }
  };

  return <>
    <AdminPageHeader title="Chỉnh sửa chương" subtitle={form?.name || "Đang tải thông tin..."} icon={<BookOpen size={22} />} backHref={returnPath} />
    <div className="admin-section-card admin-form-page">
      {error && <ErrorState description={error} />}
      {!form && !error && <div className="admin-page-state">Đang tải chương...</div>}
      {form && <form className="standalone-edit-form" onSubmit={save}>
        <label className="quiz-field"><span>Tên chương</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <label className="quiz-field"><span>Thứ tự hiển thị</span><input type="number" min="1" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} required /></label>
        <div className="modal-footer"><button type="button" className="cancel-btn" onClick={() => navigate(returnPath)}>Hủy</button><button className="add-btn" disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</button></div>
      </form>}
    </div>
  </>;
}
