import { useCallback, useEffect, useState } from "react";
import { FileText, Plus, Settings, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPageState from "../components/AdminPageState";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import {
  createTheory,
  deleteTheory,
  getChapterById,
  getChapterEditContext,
  getChaptersBySubject,
  getSubjectById,
  getTheoriesByChapter,
  updateChapter,
  updateTheory,
} from "../../../services/contentService";
import { clampChapterDisplayOrder } from "../utils/displayOrder";
import { getErrorMessage } from "../../../services/apiClient";
import { useToast } from "../../../components/ui/Toast/Toast";
import { formatScaledThetaValue } from "../../../services/mappers";
import { getSkills } from "../../../services/skillService";
import ChapterSkillsField from "../components/ChapterSkillsField";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import TheoryEditor from "../../content/components/TheoryEditor";
import {
  isTheoryContentEmpty,
  THEORY_FORMAT_BLOCKNOTE,
} from "../../content/components/theoryContentUtils";
import { toPreviewText } from "../../../components/richtext/richTextUtils";

export default function AdminChapterEdit() {
  const { subjectId, chapterId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("theories"); // "theories" | "info"
  const [form, setForm] = useState(null);
  const [subject, setSubject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState([]);

  // Theory management state
  const [theories, setTheories] = useState([]);
  const [theoriesLoading, setTheoriesLoading] = useState(false);
  const [theoriesError, setTheoriesError] = useState("");
  const [selectedTheoryId, setSelectedTheoryId] = useState(null); // theoryId or "new"
  const [theoryContent, setTheoryContent] = useState("");
  const [theoryFormat, setTheoryFormat] = useState(THEORY_FORMAT_BLOCKNOTE);
  const [savingTheory, setSavingTheory] = useState(false);
  const [deletingTheory, setDeletingTheory] = useState(null);

  const returnPath = `/admin/subjects/${subjectId}/chapters`;

  const applyTheories = useCallback((data) => {
    setTheories(data || []);
    if (data && data.length > 0) {
      setSelectedTheoryId((prevId) => {
        const found = data.find((t) => (t.theoryId || t.theory_id) === prevId);
        const target = found || data[0];
        const tid = target.theoryId || target.theory_id;
        setTheoryContent(target.content || "");
        setTheoryFormat(target.contentFormat || THEORY_FORMAT_BLOCKNOTE);
        return tid;
      });
    } else {
      setSelectedTheoryId("new");
      setTheoryContent("");
      setTheoryFormat(THEORY_FORMAT_BLOCKNOTE);
    }
  }, []);

  const loadTheories = useCallback(async () => {
    setTheoriesLoading(true);
    setTheoriesError("");
    try {
      const data = (await getTheoriesByChapter(chapterId)) || [];
      applyTheories(data);
    } catch (err) {
      setTheoriesError(getErrorMessage(err, "Không thể tải danh sách lý thuyết."));
    } finally {
      setTheoriesLoading(false);
    }
  }, [chapterId, applyTheories]);

  const loadChapterData = useCallback(async () => {
    try {
      setError("");
      let context;
      try {
        context = await getChapterEditContext(chapterId);
      } catch {
        // Resilient fallback for older backend
        const [chapter, skillRows, subjectData, chapterList] = await Promise.all([
          getChapterById(chapterId),
          getSkills(),
          getSubjectById(subjectId),
          getChaptersBySubject(subjectId),
        ]);
        context = {
          chapter,
          subjectId: subjectData?.subjectId || subjectId,
          subjectName: subjectData?.name || "",
          availableSkills: skillRows || [],
          siblingChapters: chapterList || [],
          siblingChaptersCount: (chapterList || []).length,
          theories: null,
        };
      }

      const chapter = context.chapter;
      const list = context.siblingChapters || [];
      const total = Math.max(1, context.siblingChaptersCount || list.length);
      const safeDisplayOrder = clampChapterDisplayOrder(chapter?.displayOrder, total);
      setForm({ ...chapter, displayOrder: safeDisplayOrder });
      setSkills(context.availableSkills || []);
      setSubject({ subjectId: context.subjectId || subjectId, name: context.subjectName || "" });
      setChapters(list);

      if (Array.isArray(context.theories)) {
        applyTheories(context.theories);
      } else {
        await loadTheories();
      }
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải chương."));
    }
  }, [chapterId, subjectId, applyTheories, loadTheories]);

  useEffect(() => {
    loadChapterData();
  }, [loadChapterData]);

  // Select an existing theory
  const handleSelectTheory = (theory) => {
    const tid = theory.theoryId || theory.theory_id;
    setSelectedTheoryId(tid);
    setTheoryContent(theory.content || "");
    setTheoryFormat(theory.contentFormat || THEORY_FORMAT_BLOCKNOTE);
  };

  // Switch editor to new theory mode
  const handleStartNewTheory = () => {
    setSelectedTheoryId("new");
    setTheoryContent("");
    setTheoryFormat(THEORY_FORMAT_BLOCKNOTE);
  };

  // Save theory (create or update directly)
  const handleSaveTheory = async () => {
    if (isTheoryContentEmpty(theoryContent, theoryFormat)) {
      toast.error("Nội dung lý thuyết không được để trống.");
      return;
    }

    setSavingTheory(true);
    try {
      if (selectedTheoryId === "new") {
        const created = await createTheory(chapterId, {
          content: theoryContent,
          contentFormat: theoryFormat,
        });
        toast.success("Thêm bài lý thuyết thành công.");
        const nextTheories = (await getTheoriesByChapter(chapterId)) || [];
        setTheories(nextTheories);
        const newId = created?.theoryId || created?.theory_id || nextTheories[nextTheories.length - 1]?.theoryId;
        setSelectedTheoryId(newId);
      } else {
        await updateTheory(selectedTheoryId, {
          content: theoryContent,
          contentFormat: theoryFormat,
        });
        toast.success("Cập nhật bài lý thuyết thành công.");
        const nextTheories = (await getTheoriesByChapter(chapterId)) || [];
        setTheories(nextTheories);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể lưu bài lý thuyết."));
    } finally {
      setSavingTheory(false);
    }
  };

  // Delete theory
  const handleDeleteTheory = async () => {
    if (!deletingTheory) return;
    const tid = deletingTheory.theoryId || deletingTheory.theory_id;
    try {
      await deleteTheory(tid);
      toast.success("Đã xóa bài lý thuyết.");
      setDeletingTheory(null);
      await loadTheories();
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể xóa bài lý thuyết."));
    }
  };

  const totalChapters = Math.max(1, chapters.length || 1);

  const handleDisplayOrderChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      setForm((prev) => ({ ...prev, displayOrder: "" }));
      return;
    }
    const num = Number(raw);
    if (isNaN(num) || num < 1) {
      setForm((prev) => ({ ...prev, displayOrder: 1 }));
      return;
    }
    if (num > totalChapters) {
      setForm((prev) => ({ ...prev, displayOrder: totalChapters }));
      return;
    }
    setForm((prev) => ({ ...prev, displayOrder: Math.floor(num) }));
  };

  const handleDisplayOrderBlur = () => {
    setForm((prev) => {
      const clamped = clampChapterDisplayOrder(prev?.displayOrder, totalChapters);
      return { ...prev, displayOrder: clamped };
    });
  };

  // Save chapter info & skills
  const save = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      const finalOrder = clampChapterDisplayOrder(form.displayOrder, totalChapters);
      await updateChapter(chapterId, {
        name: form.name.trim(),
        displayOrder: finalOrder,
        skills: form.skills || [],
      });
      toast.success("Cập nhật chương thành công.");
      navigate(returnPath);
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Không thể cập nhật chương."));
    } finally {
      setSaving(false);
    }
  };

  const selectedSkills = form?.skills || [];
  const currentEditingTheory = theories.find(
    (t) => (t.theoryId || t.theory_id) === selectedTheoryId,
  );
  const currentOrderNum = Number(form?.displayOrder);
  const swappedChapter =
    Number.isInteger(currentOrderNum) &&
    currentOrderNum >= 1 &&
    currentOrderNum <= totalChapters
      ? chapters.find(
          (c) =>
            (c.chapterId || c.id) !== chapterId &&
            Number(c.displayOrder) === currentOrderNum,
        )
      : null;

  return (
    <>
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
        error={!form ? error || null : null}
        errorTitle="Không tải được chương"
      >
        {form && (
          <>
            {/* 2 TABS */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "20px",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "12px",
              }}
            >
              <button
                type="button"
                className={`subject-skills-tab-btn ${activeTab === "theories" ? "is-active" : ""}`}
                onClick={() => setActiveTab("theories")}
              >
                <FileText size={15} />
                <span>Nội dung lý thuyết</span>
                <span className="subject-skills-tab-count">{theories.length}</span>
              </button>

              <button
                type="button"
                className={`subject-skills-tab-btn ${activeTab === "info" ? "is-active" : ""}`}
                onClick={() => setActiveTab("info")}
              >
                <Settings size={15} />
                <span>Thông tin &amp; Kỹ năng</span>
              </button>
            </div>

            {/* TAB 1: NỘI DUNG LÝ THUYẾT (HIỂN THỊ THẲNG BỘ SOẠN THẢO) */}
            {activeTab === "theories" && (
              <div className="admin-section-card adm2-card-pad">
                <div className="adm2-chapter-panel-head" style={{ marginBottom: "16px" }}>
                  <div className="adm2-chapter-panel-head-text">
                    <h3>Soạn thảo lý thuyết chương</h3>
                    <span className="adm2-chapter-panel-skills">
                      Soạn nội dung Rich text trực tiếp. Nội dung sẽ được lưu và đánh chỉ mục vector tự động cho AI.
                    </span>
                  </div>

                  {/* Theory Selector Pills */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    {theories.map((theory, idx) => {
                      const tid = theory.theoryId || theory.theory_id;
                      const isSelected = selectedTheoryId === tid;

                      return (
                        <button
                          key={tid}
                          type="button"
                          className={`subject-skills-tab-btn ${isSelected ? "is-active" : ""}`}
                          onClick={() => handleSelectTheory(theory)}
                          style={{ padding: "6px 12px" }}
                        >
                          <FileText size={13} />
                          <span>Bài {idx + 1}</span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      className={`subject-skills-tab-btn ${selectedTheoryId === "new" ? "is-active" : ""}`}
                      onClick={handleStartNewTheory}
                      style={{
                        padding: "6px 12px",
                        background: selectedTheoryId === "new" ? "#ecfdf5" : "#ffffff",
                        border: "1px dashed #059669",
                        color: "#059669",
                      }}
                    >
                      <Plus size={13} />
                      <span>Thêm bài mới</span>
                    </button>
                  </div>
                </div>

                {theoriesLoading ? (
                  <div className="empty-state">Đang tải lý thuyết...</div>
                ) : theoriesError ? (
                  <div className="empty-state error">{theoriesError}</div>
                ) : (
                  <div>
                    {/* INLINE RICH TEXT EDITOR */}
                    <TheoryEditor
                      key={selectedTheoryId || "editor"}
                      value={theoryContent}
                      contentFormat={theoryFormat}
                      disabled={savingTheory}
                      onChange={({ content: nextContent, contentFormat: nextFormat }) => {
                        setTheoryContent(nextContent);
                        setTheoryFormat(nextFormat);
                      }}
                    />

                    {/* Editor Action Buttons */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "16px",
                        paddingTop: "14px",
                        borderTop: "1px solid #e2e8f0",
                      }}
                    >
                      <div>
                        {currentEditingTheory && (
                          <button
                            type="button"
                            className="cancel-btn"
                            style={{ color: "#dc2626", borderColor: "#fecaca" }}
                            disabled={savingTheory}
                            onClick={() => setDeletingTheory(currentEditingTheory)}
                          >
                            <Trash2 size={14} style={{ verticalAlign: "-2px", marginRight: "4px" }} />
                            Xóa bài lý thuyết này
                          </button>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: "10px" }}>
                        {selectedTheoryId === "new" && theories.length > 0 && (
                          <button
                            type="button"
                            className="cancel-btn"
                            disabled={savingTheory}
                            onClick={() => handleSelectTheory(theories[0])}
                          >
                            Hủy
                          </button>
                        )}

                        <button
                          type="button"
                          className="add-btn"
                          disabled={savingTheory || isTheoryContentEmpty(theoryContent, theoryFormat)}
                          onClick={handleSaveTheory}
                        >
                          {savingTheory
                            ? "Đang lưu..."
                            : selectedTheoryId === "new"
                              ? "Thêm bài lý thuyết"
                              : "Lưu nội dung lý thuyết"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: THÔNG TIN & KỸ NĂNG (NỘI DUNG CÒN LẠI) */}
            {activeTab === "info" && (
              <div className="adm2-form-grid">
                <div className="admin-section-card adm2-card-pad">
                  <form className="standalone-edit-form" onSubmit={save}>
                    <div className="adm2-section-heading">
                      <h3>Thông tin chương</h3>
                    </div>

                    <div className="adm2-field-row">
                      <label className="quiz-field">
                        <span>Tên chương</span>
                        <input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                        />
                      </label>
                      <label className="quiz-field">
                        <span>Thứ tự</span>
                        <input
                          type="number"
                          min="1"
                          max={totalChapters}
                          value={form.displayOrder}
                          onChange={handleDisplayOrderChange}
                          onBlur={handleDisplayOrderBlur}
                          required
                        />
                        <span
                          className="adm2-note--muted"
                          style={{ fontSize: "12px", marginTop: "4px", display: "block" }}
                        >
                          {swappedChapter
                            ? `Sẽ đổi vị trí với: "${swappedChapter.name}" (hiện ở vị trí ${swappedChapter.displayOrder})`
                            : `Hợp lệ từ 1 đến ${totalChapters}`}
                        </span>
                      </label>
                    </div>

                    <div className="adm2-divider" />

                    <ChapterSkillsField
                      skills={skills}
                      value={form.skills || []}
                      onChange={(nextSkills) => setForm({ ...form, skills: nextSkills })}
                    />

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={() => navigate(returnPath)}
                      >
                        Hủy
                      </button>
                      <button className="add-btn" disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu chương"}
                      </button>
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
                      <p>
                        Chưa chọn kỹ năng nào. Chương tiếp theo sẽ mở khóa tự động khi sinh viên học đến chương này.
                      </p>
                    )}

                    <div className="adm2-divider" />
                    <p className="adm2-note--muted">
                      {selectedSkills.length} kỹ năng đang được áp dụng cho chương này.
                    </p>
                    <p className="adm2-note--muted">
                      Sinh viên cần đạt θ raw của tất cả kỹ năng trên để mở khóa chương tiếp theo.
                    </p>
                  </div>
                </aside>
              </div>
            )}
          </>
        )}
      </AdminPageState>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        open={Boolean(deletingTheory)}
        onClose={() => setDeletingTheory(null)}
        title="Xóa bài lý thuyết"
        message="Bạn có chắc chắn muốn xóa nội dung lý thuyết này không? Hành động này không thể hoàn tác."
        itemName={toPreviewText(deletingTheory?.content, deletingTheory?.contentFormat, 50)}
        onConfirm={handleDeleteTheory}
      />
    </>
  );
}
