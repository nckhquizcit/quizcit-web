import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPageState from "../components/AdminPageState";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import { getChapterById, getSubjectById, updateChapter } from "../../../services/contentService";
import { getErrorMessage } from "../../../services/apiClient";
import { useToast } from "../../../components/ui/Toast/Toast";
import { formatScaledThetaValue } from "../../../services/mappers";
import { getSkills } from "../../../services/skillService";
import ChapterSkillsField from "../components/ChapterSkillsField";

export default function AdminChapterEdit() {
  const { subjectId, chapterId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [subject, setSubject] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState([]);
  const returnPath = `/admin/subjects/${subjectId}/chapters`;

  useEffect(() => {
    Promise.all([getChapterById(chapterId), getSkills(), getSubjectById(subjectId)])
      .then(([chapter, skillRows, subjectData]) => {
        setForm(chapter);
        setSkills(skillRows);
        setSubject(subjectData);
      })
      .catch((loadError) => setError(getErrorMessage(loadError, "Không thể tải chương.")));
  }, [chapterId, subjectId]);

  const save = async (event) => {
    event.preventDefault();
    try {
      setSaving(true); setError("");
      await updateChapter(chapterId, { name: form.name, displayOrder: Number(form.displayOrder), skills: form.skills || [] });
      toast.success("Cập nhật chương thành công.");
      navigate(returnPath);
    } catch (saveError) { setError(getErrorMessage(saveError, "Không thể cập nhật chương.")); }
    finally { setSaving(false); }
  };

  const selectedSkills = form?.skills || [];

  return <>
    <AdminPageHeader
      breadcrumb={[
        "Tổng quan",
        "Môn học",
        { label: subject?.name || "Chương", href: returnPath },
        form?.name ? `Chương ${form?.displayOrder ?? ""}: ${form.name}` : "Chỉnh sửa chương",
      ]}
      title={`Chỉnh sửa chương ${form?.displayOrder ?? ""}`}
      subtitle={form ? `${subject?.name || ""} · ${form.name || ""}` : "Đang tải thông tin..."}
      backHref={returnPath}
      backLabel="Danh sách chương"
    />

    {form && error && <ErrorState description={error} />}
    <AdminPageState
      loading={!form && !error}
      error={!form ? (error || null) : null}
      errorTitle="Không tải được chương"
    >
    {form && (
      <div className="adm2-form-grid">
        <div className="admin-section-card adm2-card-pad">
          <form className="standalone-edit-form" onSubmit={save}>
            <div className="adm2-section-heading">
              <h3>Thông tin chương</h3>
            </div>

            <div className="adm2-field-row">
              <label className="quiz-field"><span>Tên chương</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
              <label className="quiz-field"><span>Thứ tự</span><input type="number" min="1" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} required /></label>
            </div>

            <div className="adm2-divider" />

            <ChapterSkillsField skills={skills} value={form.skills || []} onChange={(nextSkills) => setForm({ ...form, skills: nextSkills })} />

            <div className="modal-footer">
              <button type="button" className="cancel-btn" onClick={() => navigate(returnPath)}>Hủy</button>
              <button className="add-btn" disabled={saving}>{saving ? "Đang lưu..." : "Lưu chương"}</button>
            </div>
          </form>
        </div>

        <aside className="adm2-aside-stack">
          <div className="adm2-card adm2-aside-card">
            <span className="adm2-chip">Điều kiện mở chương sau</span>
            <h4>Yêu cầu hoàn thành chương này</h4>

            {selectedSkills.length > 0 ? (
              <ul className="adm2-condition-list">
                {selectedSkills.map((skill) => {
                  const raw = Number(skill.requiredTheta);
                  const rawLabel = Number.isFinite(raw) ? raw : 0;
                  return (
                    <li key={skill.skillId}>
                      <span>{skill.name}</span>
                      <strong>
                        ≥ {rawLabel} raw (≈ {formatScaledThetaValue(rawLabel)})
                      </strong>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>Chưa chọn kỹ năng nào. Chương tiếp theo sẽ mở khóa tự động khi sinh viên học đến chương này.</p>
            )}

            <div className="adm2-divider" />
            <p className="adm2-note--muted">{selectedSkills.length} kỹ năng đang được áp dụng cho chương này.</p>
            <p className="adm2-note--muted">
              Sinh viên cần đạt θ raw của tất cả kỹ năng trên để mở khóa chương tiếp theo.
            </p>
          </div>
        </aside>
      </div>
    )}
    </AdminPageState>
  </>;
}
