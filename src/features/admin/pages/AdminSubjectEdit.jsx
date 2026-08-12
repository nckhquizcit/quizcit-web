import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../components/AdminPageHeader";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import { getChaptersBySubject, getSubjectById, updateSubject } from "../../../services/contentService";
import { getErrorMessage } from "../../../services/apiClient";
import { useToast } from "../../../components/ui/Toast/Toast";

export default function AdminSubjectEdit() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [chapterCount, setChapterCount] = useState(0);
  const returnPath = "/admin/subjects";
  const chaptersPath = `/admin/subjects/${subjectId}/chapters`;

  useEffect(() => {
    getSubjectById(subjectId).then(setForm).catch((loadError) => setError(getErrorMessage(loadError, "Không thể tải môn học.")));
  }, [subjectId]);

  useEffect(() => {
    getChaptersBySubject(subjectId)
      .then((data) => setChapterCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setChapterCount(0));
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

  const isVisible = form?.visible !== false;

  return <>
    <AdminPageHeader
      title="Chỉnh sửa môn học"
      subtitle="Cập nhật thông tin hiển thị và thứ tự."
      backHref={returnPath}
      backLabel="Danh sách môn"
    />

    {error && <ErrorState description={error} />}
    {!form && !error && <div className="admin-page-state">Đang tải môn học...</div>}

    {form && (
      <div className="adm2-form-grid">
        <div className="admin-section-card adm2-card-pad">
          <form className="standalone-edit-form" onSubmit={save}>
            <label className="quiz-field">
              <span>Tên môn học</span>
              <input value={form.name} onChange={(e) => setField("name", e.target.value)} maxLength={200} required />
            </label>

            <div className="adm2-field-row">
              <label className="quiz-field">
                <span>Mã môn</span>
                <input value={form.courseCode} onChange={(e) => setField("courseCode", e.target.value)} maxLength={20} required />
              </label>
              <label className="quiz-field">
                <span>Thứ tự hiển thị</span>
                <input type="number" min="1" value={form.displayOrder} onChange={(e) => setField("displayOrder", e.target.value)} required />
              </label>
            </div>

            <label className="quiz-field">
              <span>Mô tả</span>
              <textarea rows="5" value={form.description || ""} onChange={(e) => setField("description", e.target.value)} />
            </label>

            <div
              className="adm2-toggle-row"
              role="switch"
              aria-checked={isVisible}
              tabIndex={0}
              onClick={() => setField("visible", !isVisible)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setField("visible", !isVisible);
                }
              }}
            >
              <div className="adm2-toggle-row__text">
                <strong>Hiển thị môn học cho người dùng</strong>
                <span>Khi tắt, người dùng thường sẽ không thể xem môn học và nội dung liên quan.</span>
              </div>
              <span className={`adm2-switch ${isVisible ? "is-on" : ""}`} />
            </div>

            <p className="adm2-note adm2-note--muted">
              <strong>Giới hạn:</strong> Mã môn tối đa 20 ký tự · Tên tối đa 200 ký tự.
            </p>

            <div className="modal-footer">
              <button type="button" className="cancel-btn" onClick={() => navigate(returnPath)}>Hủy</button>
              <button className="add-btn" disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</button>
            </div>
          </form>
        </div>

        <aside className="adm2-aside-stack">
          <div className="adm2-card adm2-aside-card">
            <span className="adm2-chip">Ảnh hưởng</span>
            <h4>Môn học có {chapterCount} chương</h4>
            <p>Đổi tên/mã không làm mất dữ liệu.</p>
            <p>Ẩn môn sẽ ngăn user truy cập mới.</p>
            <div className="adm2-divider" />
            <button type="button" className="adm2-link-arrow" onClick={() => navigate(chaptersPath)}>
              Xem danh sách chương <ArrowRight size={14} />
            </button>
          </div>
        </aside>
      </div>
    )}
  </>;
}
