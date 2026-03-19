// src/mock/api.js

import { subjects, chapters, questions } from "./mockData";

// SUBJECT
export const getSubjects = () => subjects;

// CHAPTER theo subject
export const getChaptersBySubject = (subjectId) => {
  return chapters.filter((c) => c.subjectId === subjectId);
};

// QUESTION theo chapter
export const getQuestionsByChapter = (chapterId) => {
  return questions.filter((q) => q.chapterId === chapterId);
};

// lấy subject detail
export const getSubjectById = (id) => {
  return subjects.find((s) => s.id === id);
};

// lấy chapter detail
export const getChapterById = (id) => {
  return chapters.find((c) => c.id === id);
};
