export {
  createSubject,
  deleteSubject,
  getSubjectById,
  getSubjects,
  updateSubject,
} from "./subjectService";

export {
  createChapter,
  deleteChapter,
  getChapterById,
  getChaptersBySubject,
  updateChapter,
} from "./chapterService";

export {
  createTheory,
  deleteTheory,
  getTheoriesByChapter,
  getTheoryById,
  updateTheory,
} from "./theoryService";

export { getQuizzesBySubject } from "./quizService";
