import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AdminPageHeader from "../components/AdminPageHeader";
import { QuestionForm } from "../components/modals/AddQuestionModal";
import { useToast } from "../../../components/ui/Toast/Toast";
import { createQuestion } from "../../../services/quizService";

const normalizeSkillPayload = (skills = []) =>
  skills.map((skill) => ({
    skillId: skill.skillId,
    weight: Number(skill.weight),
    primary: Boolean(skill.primary),
  }));

export default function AdminQuestionCreate() {
  const { subjectId, chapterId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const returnPath =
    subjectId && chapterId
      ? `/admin/subjects/${subjectId}/chapters/${chapterId}/questions`
      : "/admin/questions";
  const routeSubject = useMemo(
    () => (subjectId ? { subjectId } : undefined),
    [subjectId],
  );
  const routeChapter = useMemo(
    () => (chapterId ? { chapterId, subjectId } : undefined),
    [chapterId, subjectId],
  );
  const goBack = () => {
    navigate(returnPath);
  };

  const handleSubmit = async (formValues) => {
    await createQuestion({
      subjectId: formValues.subjectId,
      chapterId: formValues.chapterId,
      content: formValues.content,
      explanation: formValues.explanation,
      contentFormat: formValues.contentFormat,
      difficultyB: Number(formValues.difficultyB),
      skills: normalizeSkillPayload(formValues.skills),
      options: formValues.options,
    });

    toast.success("Đã thêm câu hỏi mới.");
    navigate(returnPath);
  };

  return (
    <>
      <AdminPageHeader
        title="Tạo câu hỏi mới"
        subtitle="Soạn nội dung, đáp án, kỹ năng và độ khó IRT."
        backHref={returnPath}
        backLabel="Ngân hàng câu hỏi"
        action={<span className="adm2-status-chip">Đang soạn</span>}
      />

      <QuestionForm
        open
        subject={routeSubject}
        chapter={routeChapter}
        onCancel={goBack}
        onSubmit={handleSubmit}
        variant="page"
      />
    </>
  );
}
