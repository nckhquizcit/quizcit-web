import { chapters, subjects } from '../../home/data/homeData';

const subjectMeta = {
  s1: {
    accent: 'priority',
    category: 'Nền tảng thuật toán',
    weeklyGoal: 'Ôn 3 buổi/tuần',
    focus: 'Tăng tốc phần cây, đồ thị và bài luyện tập tổng hợp.',
  },
  s2: {
    accent: 'steady',
    category: 'Phát triển phần mềm',
    weeklyGoal: 'Ôn 2 buổi/tuần',
    focus: 'Củng cố quan hệ lớp, interface và bài tập mô hình hóa.',
  },
  s3: {
    accent: 'warning',
    category: 'Toán cho CNTT',
    weeklyGoal: 'Ôn 3 buổi/tuần',
    focus: 'Ưu tiên logic mệnh đề và đồ thị cơ bản trong tuần này.',
  },
  s4: {
    accent: 'warning',
    category: 'Dữ liệu và hệ quản trị',
    weeklyGoal: 'Ôn 2 buổi/tuần',
    focus: 'Bắt đầu với mô hình quan hệ và truy vấn SQL cơ bản.',
  },
};

function getCompletedChapters(totalChapters, progress) {
  return Math.min(totalChapters, Math.max(0, Math.round((progress / 100) * totalChapters)));
}

export function getSubjectCollection() {
  return subjects.map((subject) => {
    const subjectChapters = chapters.filter(
      (chapter) => chapter.subject_id === subject.subject_id
    );
    const completedChapters = getCompletedChapters(
      subjectChapters.length,
      subject.progress
    );

    return {
      ...subject,
      ...subjectMeta[subject.subject_id],
      chapterCount: subjectChapters.length,
      completedChapters,
      nextChapter:
        subjectChapters[Math.min(completedChapters, subjectChapters.length - 1)] ||
        null,
      chapterPreview: subjectChapters.slice(0, 3),
      isPriority: subject.progress < 50,
      status:
        subject.progress >= 80
          ? 'Sẵn sàng kiểm tra'
          : subject.progress >= 50
            ? 'Đang duy trì tốt'
            : 'Cần ưu tiên ôn tập',
    };
  });
}
