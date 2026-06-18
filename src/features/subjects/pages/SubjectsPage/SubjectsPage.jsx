import { useMemo, useState } from 'react';
import { useEffect } from "react";
import { BookOpen, Search, Sparkles, Target } from 'lucide-react';
import { getChaptersBySubject, getSubjects } from "../../../../services/contentService";
import SubjectCard from '../../components/SubjectCard';
import './SubjectsPage.css';

const FILTER_OPTIONS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'priority', label: 'Ưu tiên AI' },
  { id: 'in-progress', label: 'Đang học' },
  { id: 'almost-done', label: 'Gần hoàn thành' },
];

function getFilteredSubjects(subjects, activeFilter, searchTerm) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return subjects.filter((subject) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      subject.name.toLowerCase().includes(normalizedSearch) ||
      subject.course_code.toLowerCase().includes(normalizedSearch) ||
      subject.category.toLowerCase().includes(normalizedSearch);

    if (!matchesSearch) {
      return false;
    }

    switch (activeFilter) {
      case 'priority':
        return subject.progress < 50;
      case 'in-progress':
        return subject.progress >= 50 && subject.progress < 80;
      case 'almost-done':
        return subject.progress >= 80;
      default:
        return true;
    }
  });
}

export default function SubjectsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectCollection, setSubjectCollection] = useState([]);

  useEffect(() => {
    const loadSubjects = async () => {
      const subjects = (await getSubjects()) || [];
      const withChapters = await Promise.all(
        subjects.map(async (subject) => {
          const chapters = (await getChaptersBySubject(subject.subjectId)) || [];
          return {
            ...subject,
            chapterCount: chapters.length,
            chapterPreview: chapters.slice(0, 3).map((chapter) => ({
              chapter_id: chapter.chapterId,
              name: chapter.name,
            })),
          };
        }),
      );

      setSubjectCollection(
        withChapters.map((subject) => ({
          ...subject,
          subject_id: subject.subjectId,
          course_code: subject.courseCode,
          accent: "blue",
          status: "Đang học",
          weeklyGoal: "2 chương/tuần",
          category: "Nền tảng",
          progress: 0,
          completedChapters: 0,
          nextChapter: subject.chapterPreview[0] || null,
          focus: "Tiếp tục học nội dung lý thuyết theo từng chương.",
        })),
      );
    };
    loadSubjects();
  }, []);

  const filteredSubjects = useMemo(
    () => getFilteredSubjects(subjectCollection, activeFilter, searchTerm),
    [activeFilter, searchTerm, subjectCollection]
  );

  const summary = useMemo(() => {
    const totalSubjects = subjectCollection.length;
    const totalProgress = subjectCollection.reduce(
      (sum, subject) => sum + subject.progress,
      0
    );
    const prioritySubjects = subjectCollection.filter(
      (subject) => subject.isPriority
    ).length;
    const completedChapters = subjectCollection.reduce(
      (sum, subject) => sum + subject.completedChapters,
      0
    );

    return {
      totalSubjects,
      averageProgress: totalSubjects ? Math.round(totalProgress / totalSubjects) : 0,
      prioritySubjects,
      completedChapters,
    };
  }, [subjectCollection]);

  return (
    <section className="subjects-page">
      <header className="subjects-page__hero">
        <div>
          <p className="subjects-page__eyebrow">Learning Hub</p>
          <h1>Môn học</h1>
          <p className="subjects-page__description">
            Theo dõi các môn đang học, mức độ hoàn thành từng học phần và đề
            xuất ưu tiên ôn tập theo đúng tinh thần từ bản thiết kế Figma.
          </p>
        </div>

        <div className="subjects-page__hero-card">
          <div className="subjects-page__hero-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <h2>Khuyến nghị hôm nay</h2>
            <p>
              Ưu tiên mở lại các môn dưới 50% tiến độ để giữ mạch học và tránh
              quên kiến thức nền.
            </p>
          </div>
        </div>
      </header>

      <section className="subjects-page__summary-grid">
        <article className="subjects-summary-card subjects-summary-card--highlight">
          <div className="subjects-summary-card__icon">
            <BookOpen size={20} />
          </div>
          <div>
            <p>Tổng số môn học</p>
            <h2>{summary.totalSubjects}</h2>
            <span>Danh sách môn hiện có trong lộ trình học tập của bạn.</span>
          </div>
        </article>

        <article className="subjects-summary-card">
          <div className="subjects-summary-card__icon subjects-summary-card__icon--soft">
            <Target size={20} />
          </div>
          <div>
            <p>Tiến độ trung bình</p>
            <h2>{summary.averageProgress}%</h2>
            <span>{summary.completedChapters} chương đã được hoàn thành.</span>
          </div>
        </article>

        <article className="subjects-summary-card">
          <div className="subjects-summary-card__icon subjects-summary-card__icon--soft">
            <Sparkles size={20} />
          </div>
          <div>
            <p>Môn cần ưu tiên</p>
            <h2>{summary.prioritySubjects}</h2>
            <span>Được AI gợi ý cần tập trung ôn tập trong tuần này.</span>
          </div>
        </article>
      </section>

      <section className="subjects-toolbar">
        <div className="subjects-toolbar__search">
          <Search size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo tên môn, mã môn hoặc nhóm kiến thức"
          />
        </div>

        <div className="subjects-toolbar__filters">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`subjects-filter-chip ${
                activeFilter === filter.id ? 'subjects-filter-chip--active' : ''
              }`}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="subjects-page__grid">
        {filteredSubjects.map((subject) => (
          <SubjectCard key={subject.subject_id} subject={subject} />
        ))}
      </section>

      {filteredSubjects.length === 0 && (
        <div className="subjects-page__empty-state">
          <h2>Không tìm thấy môn học phù hợp</h2>
          <p>
            Hãy thử từ khóa khác hoặc chuyển sang bộ lọc khác để xem toàn bộ
            danh sách môn học.
          </p>
        </div>
      )}
    </section>
  );
}
