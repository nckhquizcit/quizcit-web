import './ComingSoonPage.css';

export default function ComingSoonPage({
  title = 'Tính năng đang cập nhật',
  description = 'Khu vực này sẽ được hoàn thiện ở các bước tiếp theo.',
}) {
  return (
    <section className="coming-soon-page">
      <div className="coming-soon-card">
        <p className="coming-soon-page__eyebrow">QuizCIT</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  );
}
