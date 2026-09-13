import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Plus, Settings, Trash2 } from "lucide-react";
import { useBlocker, useNavigate, useParams } from "react-router-dom";
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
import ConfirmActionModal from "../components/modals/ConfirmActionModal";
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

  // Noi dung ly thuyet da sua nhung chua luu.
  // theoryBaselineRef giu ban goc luc nap de khong bat co khi trinh soan thao
  // phat su kien luc khoi tao ma nguoi dung chua go gi.
  const [theoryDirty, setTheoryDirty] = useState(false);
  const theoryBaselineRef = useRef("");
  // Ban sao moi nhat cua bai dang chon, de applyTheories tinh duoc bai muc tieu
  // ma khong phai dat tac dung phu trong ham cap nhat state.
  const selectedTheoryIdRef = useRef(null);
  selectedTheoryIdRef.current = selectedTheoryId;
  // Y dinh nguoi dung dang cho xac nhan: { type: "theory", theory } hoac { type: "tab", tab }.
  const [pendingTheoryAction, setPendingTheoryAction] = useState(null);

  const returnPath = `/admin/subjects/${subjectId}/chapters`;

  // Nap noi dung vao trinh soan thao va ghi lai ban goc de so sanh sau nay.
  const applyTheoryContent = useCallback((content, format) => {
    const nextContent = content || "";
    theoryBaselineRef.current = nextContent;
    setTheoryContent(nextContent);
    setTheoryFormat(format || THEORY_FORMAT_BLOCKNOTE);
    setTheoryDirty(false);
  }, []);

  const applyTheories = useCallback((data) => {
    const list = data || [];
    setTheories(list);
    if (list.length > 0) {
      // Giu bai dang mo neu con ton tai, khong thi lay bai dau.
      // Tinh san ngoai ham cap nhat state: dat tac dung phu trong do se bi
      // chay hai lan duoi StrictMode.
      const found = list.find(
        (t) => (t.theoryId || t.theory_id) === selectedTheoryIdRef.current,
      );
      const target = found || list[0];
      setSelectedTheoryId(target.theoryId || target.theory_id);
      applyTheoryContent(target.content, target.contentFormat);
    } else {
      setSelectedTheoryId("new");
      applyTheoryContent("", THEORY_FORMAT_BLOCKNOTE);
    }
  }, [applyTheoryContent]);

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

  // Select an existing theory (di qua guard de khong mat ban nhap dang do)
  const handleSelectTheory = (theory) => {
    if (theoryDirty) {
      setPendingTheoryAction({ type: "theory", theory });
      return;
    }
    const tid = theory.theoryId || theory.theory_id;
    setSelectedTheoryId(tid);
    applyTheoryContent(theory.content, theory.contentFormat);
  };

  // Switch editor to new theory mode
  const handleStartNewTheory = () => {
    if (theoryDirty) {
      setPendingTheoryAction({ type: "theory", theory: null });
      return;
    }
    setSelectedTheoryId("new");
    applyTheoryContent("", THEORY_FORMAT_BLOCKNOTE);
  };

  // Xac nhan bo ban nhap ly thuyet dang do de chuyen bai / them bai moi / doi tab.
  const confirmDiscardTheoryDraft = () => {
    const action = pendingTheoryAction;
    setPendingTheoryAction(null);
    if (!action) return;

    if (action.type === "tab") {
      setActiveTab(action.tab);
      return;
    }

    if (action.theory) {
      const tid = action.theory.theoryId || action.theory.theory_id;
      setSelectedTheoryId(tid);
      applyTheoryContent(action.theory.content, action.theory.contentFormat);
    } else {
      setSelectedTheoryId("new");
      applyTheoryContent("", THEORY_FORMAT_BLOCKNOTE);
    }
  };

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    if (theoryDirty) {
      setPendingTheoryAction({ type: "tab", tab });
      return;
    }
    setActiveTab(tab);
  };

  // Edit theory content
  const handleTheoryContentChange = ({ content: nextContent, contentFormat: nextFormat }) => {
    setTheoryContent(nextContent);
    setTheoryFormat(nextFormat);
    setTheoryDirty(nextContent !== theoryBaselineRef.current);
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
        theoryBaselineRef.current = theoryContent;
        setTheoryDirty(false);
      } else {
        await updateTheory(selectedTheoryId, {
          content: theoryContent,
          contentFormat: theoryFormat,
        });
        toast.success("Cập nhật bài lý thuyết thành công.");
        const nextTheories = (await getTheoriesByChapter(chapterId)) || [];
        setTheories(nextTheories);
        theoryBaselineRef.current = theoryContent;
        setTheoryDirty(false);
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

  // Chan roi trang khi con ban nhap ly thuyet chua luu.
  const shouldBlock = theoryDirty;
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        shouldBlock && currentLocation.pathname !== nextLocation.pathname,
      [shouldBlock],
    ),
  );

  useEffect(() => {
    if (!shouldBlock) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue =
        "Bạn có nội dung lý thuyết chưa lưu, nếu rời trang thì phần vừa soạn sẽ mất.";
      return event.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldBlock]);

  const totalChapters = Math.max(1, chapters.length || 1);
  // Chi ep khoang khi danh sach chuong anh em that su co du lieu. Neu tai hong
  // hoac rong thi totalChapters = 1, ep vao se keo chuong dang o vi tri 5 ve 1.
  const canClampDisplayOrder = chapters.length > 0;

  const handleDisplayOrderChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      setForm((prev) => ({ ...prev, displayOrder: "" }));
      return;
    }
    // Chi chan ky tu khong phai so, khong ep khoang khi dang go.
    // Voi o type="number", trinh duyet da tra ve chuoi rong cho gia tri khong hop le.
    const num = Number(raw);
    if (isNaN(num)) return;
    setForm((prev) => ({ ...prev, displayOrder: Math.floor(num) }));
  };

  const handleDisplayOrderBlur = () => {
    if (!canClampDisplayOrder) return;
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
      const finalOrder = canClampDisplayOrder
        ? clampChapterDisplayOrder(form.displayOrder, totalChapters)
        : Number(form.displayOrder) || form.displayOrder;
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
            <div className="subject-skills-tabs">
              <button
                type="button"
                className={`subject-skills-tab-btn ${activeTab === "theories" ? "is-active" : ""}`}
                onClick={() => handleTabChange("theories")}
              >
                <FileText size={15} />
                <span>Nội dung lý thuyết</span>
                <span className="subject-skills-tab-count">{theories.length}</span>
              </button>

              <button
                type="button"
                className={`subject-skills-tab-btn ${activeTab === "info" ? "is-active" : ""}`}
                onClick={() => handleTabChange("info")}
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
                  <div className="subject-skills-pill-list">
                    {theories.map((theory, idx) => {
                      const tid = theory.theoryId || theory.theory_id;
                      const isSelected = selectedTheoryId === tid;

                      return (
                        <button
                          key={tid}
                          type="button"
                          className={`subject-skills-tab-btn subject-skills-tab-btn--pill ${
                            isSelected ? "is-active" : ""
                          }`}
                          onClick={() => handleSelectTheory(theory)}
                        >
                          <FileText size={13} />
                          <span>Bài {idx + 1}</span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      className={`subject-skills-tab-btn subject-skills-tab-btn--pill subject-skills-tab-btn--dashed ${
                        selectedTheoryId === "new" ? "is-active" : ""
                      }`}
                      onClick={handleStartNewTheory}
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
                      onChange={handleTheoryContentChange}
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

      {/* CONFIRM DISCARD THEORY DRAFT */}
      <ConfirmActionModal
        isOpen={Boolean(pendingTheoryAction)}
        onClose={() => setPendingTheoryAction(null)}
        onConfirm={confirmDiscardTheoryDraft}
        user={{ displayName: "bản nháp" }}
        message={
          pendingTheoryAction?.type === "tab" ? (
            <>
              Nội dung lý thuyết bạn vừa soạn <strong>chưa được lưu</strong>. Đổi sang tab khác sẽ mất phần
              vừa soạn. Bạn có muốn tiếp tục?
            </>
          ) : pendingTheoryAction?.theory ? (
            <>
              Nội dung lý thuyết bạn vừa soạn <strong>chưa được lưu</strong>. Chuyển sang bài khác sẽ mất
              phần vừa soạn. Bạn có muốn tiếp tục?
            </>
          ) : (
            <>
              Nội dung lý thuyết bạn vừa soạn <strong>chưa được lưu</strong>. Thêm bài mới sẽ mất phần vừa
              soạn. Bạn có muốn tiếp tục?
            </>
          )
        }
      />

      {/* CONFIRM LEAVE PAGE WITH UNSAVED THEORY */}
      <ConfirmActionModal
        isOpen={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        user={{ displayName: "bản nháp" }}
        message={
          <>
            Nội dung lý thuyết bạn vừa soạn <strong>chưa được lưu</strong>. Rời trang sẽ mất phần vừa soạn.
            Bạn có muốn rời trang?
          </>
        }
      />
    </>
  );
}
