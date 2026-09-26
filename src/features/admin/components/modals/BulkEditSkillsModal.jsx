import React, { useState, useMemo } from "react";
import Modal from "../ui/Modal";
import { X, Plus, RefreshCcw } from "lucide-react";
import { useToast } from "../../../../components/ui/Toast/Toast";

export default function BulkEditSkillsModal({ open, onClose, selectedQuestions, allChapters, onConfirm }) {
  const [addingSkillId, setAddingSkillId] = useState("");
  const [replacements, setReplacements] = useState({}); // { oldSkillId: newSkillId }
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Lấy các kỹ năng hiện có trong các câu hỏi được chọn
  const existingSkills = useMemo(() => {
    const skillMap = new Map();
    (selectedQuestions || []).forEach(q => {
      (q.skills || []).forEach(s => {
        if (!skillMap.has(s.skillId)) {
          skillMap.set(s.skillId, s);
        }
      });
    });
    return Array.from(skillMap.values());
  }, [selectedQuestions]);

  // Lấy danh sách kỹ năng khả dụng dựa trên các chương của các câu hỏi được chọn
  const [availableSkills, setAvailableSkills] = useState([]);
  const [isFetchingSkills, setIsFetchingSkills] = useState(false);

  React.useEffect(() => {
    if (!open) return;

    const subjectIds = new Set((selectedQuestions || []).map(q => q.subjectId).filter(Boolean));
    if (subjectIds.size === 0) {
      setAvailableSkills([]);
      return;
    }

    let isMounted = true;
    const fetchSkills = async () => {
      try {
        setIsFetchingSkills(true);
        // We import getChaptersBySubject dynamically or at the top
        const { getChaptersBySubject } = await import("../../../../services/contentService");
        
        const results = await Promise.all(Array.from(subjectIds).map(sid => getChaptersBySubject(sid)));
        if (!isMounted) return;

        const chapters = results.flat();
        const chapterIds = new Set((selectedQuestions || []).map(q => q.chapterId).filter(Boolean));
        const skillMap = new Map();
        
        chapterIds.forEach(chapterId => {
          const chapter = chapters.find(c => String(c.chapterId) === String(chapterId));
          if (chapter && Array.isArray(chapter.skills)) {
            chapter.skills.forEach(s => {
              if (!skillMap.has(s.skillId)) {
                skillMap.set(s.skillId, s);
              }
            });
          }
        });
        setAvailableSkills(Array.from(skillMap.values()));
      } catch (err) {
        if (isMounted) toast.error("Không thể tải danh sách kỹ năng");
      } finally {
        if (isMounted) setIsFetchingSkills(false);
      }
    };
    
    fetchSkills();
    
    return () => {
      isMounted = false;
    };
  }, [open, selectedQuestions]);

  const handleReplacementChange = (oldSkillId, newSkillId) => {
    setReplacements(prev => {
      const next = { ...prev };
      if (!newSkillId) {
        delete next[oldSkillId];
      } else {
        next[oldSkillId] = newSkillId;
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onConfirm({ addingSkillId, replacements });
      onClose();
    } catch (error) {
      toast.error(error.message || "Đã xảy ra lỗi khi lưu kỹ năng hàng loạt");
    } finally {
      setLoading(false);
    }
  };

  // Reset form khi đóng
  React.useEffect(() => {
    if (!open) {
      setAddingSkillId("");
      setReplacements({});
    }
  }, [open]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} labelledById="bulk-edit-skills-title">
      <div className="question-modal bulk-skills-modal">
        <h2 id="bulk-edit-skills-title">Sửa kỹ năng hàng loạt</h2>
        <p>Thao tác này áp dụng cho {selectedQuestions?.length || 0} câu hỏi đang chọn.</p>

        <div className="admin-section-card adm2-card-pad" style={{ marginTop: "1rem" }}>
          <h3 style={{ fontSize: "14px", marginBottom: "1rem" }}>Thay thế kỹ năng hiện có</h3>
          {isFetchingSkills && <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Đang tải danh sách kỹ năng...</p>}
          {existingSkills.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Các câu hỏi được chọn chưa có kỹ năng nào.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {existingSkills.map(skill => (
                <div key={skill.skillId} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ flex: 1, padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: "6px", fontSize: "13px" }}>
                    {skill.name || skill.skillId}
                  </div>
                  <RefreshCcw size={14} color="var(--text-secondary)" />
                  <select 
                    style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "13px" }}
                    value={replacements[skill.skillId] || ""}
                    onChange={(e) => handleReplacementChange(skill.skillId, e.target.value)}
                  >
                    <option value="">Giữ nguyên</option>
                    <option value="REMOVE">Xóa kỹ năng này</option>
                    {availableSkills.map(avail => (
                      <option key={avail.skillId} value={avail.skillId} disabled={avail.skillId === skill.skillId}>
                        Thành: {avail.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-section-card adm2-card-pad" style={{ marginTop: "1rem" }}>
          <h3 style={{ fontSize: "14px", marginBottom: "1rem" }}>Thêm kỹ năng mới (áp dụng cho tất cả)</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <Plus size={16} color="var(--text-secondary)" />
            <select 
              style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "13px" }}
              value={addingSkillId}
              onChange={(e) => setAddingSkillId(e.target.value)}
            >
              <option value="">Không thêm</option>
              {availableSkills.map(avail => (
                <option key={avail.skillId} value={avail.skillId}>
                  Thêm: {avail.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: "2rem" }}>
          <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button type="button" className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang xử lý..." : "Áp dụng"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
