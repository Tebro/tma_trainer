import {
  getLessonProgress,
  type LessonProgressEntry,
} from '../storage/progress';
import type { Lesson } from '../lessons/schema';
import './LessonLibrary.css';

interface Props {
  lessons: Lesson[];
  onSelectLesson: (lessonId: string) => void;
}

export function LessonLibrary({ lessons, onSelectLesson }: Props) {
  const progress = getLessonProgress();

  return (
    <div className="lesson-library">
      <header className="lesson-library__header">
        <h1>TMA Trainer</h1>
        <p className="lesson-library__subtitle">
          Learn Target Motion Analysis through guided practice
        </p>
      </header>

      <main className="lesson-library__grid">
        {lessons.map((lesson) => {
          const p = progress[lesson.id];
          return (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              progress={p}
              onClick={() => onSelectLesson(lesson.id)}
            />
          );
        })}
      </main>
    </div>
  );
}

function LessonCard({
  lesson,
  progress,
  onClick,
}: {
  lesson: Lesson;
  progress?: LessonProgressEntry;
  onClick: () => void;
}) {
  const isCompleted = progress !== undefined;
  const difficultyClass = `difficulty-${lesson.difficulty}`;

  return (
    <button
      className={`lesson-card ${isCompleted ? 'lesson-card--completed' : ''}`}
      onClick={onClick}
      type="button"
    >
      <div className="lesson-card__header">
        <span className={`lesson-card__difficulty ${difficultyClass}`}>
          {lesson.difficulty}
        </span>
        {isCompleted && (
          <span className="lesson-card__badge">
            {Math.round((progress?.bestScore ?? 0) * 100)}%
          </span>
        )}
      </div>

      <h3 className="lesson-card__title">{lesson.title}</h3>
      <p className="lesson-card__summary">{lesson.summary}</p>

      <div className="lesson-card__meta">
        <span>{lesson.tasks.length} tasks</span>
        {isCompleted && (
          <span className="lesson-card__attempts">
            {progress?.attempts} attempt{progress?.attempts === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {isCompleted && (
        <div className="lesson-card__progress-bar">
          <div
            className="lesson-card__progress-fill"
            style={{
              width: `${Math.round((progress?.bestScore ?? 0) * 100)}%`,
            }}
          />
        </div>
      )}
    </button>
  );
}
