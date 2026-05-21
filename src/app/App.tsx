import { useCallback, useState } from 'react';
import type { Lesson } from '../lessons/schema';
import { loadAllLessons, loadLessonById } from '../lessons/loader';
import { LessonLibrary } from '../components/LessonLibrary';
import { DrillLibrary } from '../components/DrillLibrary';
import type {
  DrillTemplate,
  DrillDifficulty,
} from '../simulation/drillGenerator';
import { generateDrill } from '../simulation/drillGenerator';
import { LessonWorkspace } from './LessonWorkspace';
import { DrillWorkspace } from './DrillWorkspace';
import { DebriefWorkspace } from './DebriefWorkspace';
import { AttemptHistory } from '../components/AttemptHistory';
import './App.css';

type View = 'library' | 'lesson' | 'debrief' | 'drill';

interface DebriefSnapshot {
  lesson?: Lesson;
  title: string;
  scenario: import('../simulation/scenarioTypes').Scenario;
  truthState: import('../simulation/playback').TruthSnapshot;
  observations: Array<{
    timestampSec: number;
    observations: import('../simulation/scenarioTypes').Observation[];
  }>;
  estimates: import('../simulation/scenarioTypes').Estimate[];
}

export function App() {
  const [view, setView] = useState<View>('library');
  const [activeTab, setActiveTab] = useState<'lessons' | 'drills' | 'history'>(
    'lessons'
  );
  const [allLessons] = useState<Lesson[]>(() => loadAllLessons());
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeScenario, setActiveScenario] = useState<
    import('../simulation/scenarioTypes').Scenario | null
  >(null);
  const [activeSeed, setActiveSeed] = useState<string>('');
  const [debriefData, setDebriefData] = useState<DebriefSnapshot | null>(null);
  const [seed] = useState('lesson-1');

  const handleSelectLesson = useCallback((lessonId: string) => {
    const lesson = loadLessonById(lessonId);
    setActiveLesson(lesson);
    setActiveScenario(null);
    setDebriefData(null);
    setView('lesson');
  }, []);

  const handleSelectDrill = useCallback(
    (
      template: DrillTemplate,
      difficulty: DrillDifficulty,
      drillSeed: string
    ) => {
      const scenario = generateDrill(template, difficulty, drillSeed);
      setActiveLesson(null);
      setActiveScenario(scenario);
      setActiveSeed(drillSeed);
      setDebriefData(null);
      setView('drill');
    },
    []
  );

  const handleBackToLibrary = useCallback(() => {
    setActiveLesson(null);
    setActiveScenario(null);
    setDebriefData(null);
    setView('library');
  }, []);

  const handleRetry = useCallback(() => {
    setDebriefData(null);
    setView('lesson');
  }, []);

  const handleRetryDrill = useCallback(() => {
    if (activeScenario) {
      setActiveSeed(`drill-${Date.now()}`);
      setDebriefData(null);
      setView('drill');
    }
  }, [activeScenario]);

  if (view === 'library') {
    return (
      <div className="app-library">
        <header className="app-library__header">
          <div className="app-library__brand">TMA Trainer</div>
          <nav className="app-library__tabs">
            <button
              className={activeTab === 'lessons' ? 'active' : ''}
              onClick={() => setActiveTab('lessons')}
              type="button"
            >
              Lessons
            </button>
            <button
              className={activeTab === 'drills' ? 'active' : ''}
              onClick={() => setActiveTab('drills')}
              type="button"
            >
              Drills
            </button>
            <button
              className={activeTab === 'history' ? 'active' : ''}
              onClick={() => setActiveTab('history')}
              type="button"
            >
              History
            </button>
          </nav>
        </header>
        <main className="app-library__main">
          {activeTab === 'lessons' && (
            <LessonLibrary
              lessons={allLessons}
              onSelectLesson={handleSelectLesson}
            />
          )}
          {activeTab === 'drills' && (
            <DrillLibrary onSelectDrill={handleSelectDrill} />
          )}
          {activeTab === 'history' && <AttemptHistory />}
        </main>
      </div>
    );
  }

  if (view === 'lesson' && activeLesson) {
    return (
      <LessonWorkspace
        lesson={activeLesson}
        seed={seed}
        onFinish={(_score, data) => {
          setDebriefData({
            ...data,
            lesson: activeLesson,
            title: activeLesson.title,
          });
          setView('debrief');
        }}
        onBack={handleBackToLibrary}
      />
    );
  }

  if (view === 'drill' && activeScenario) {
    return (
      <DrillWorkspace
        scenario={activeScenario}
        seed={activeSeed}
        onFinish={(data) => {
          setDebriefData({ ...data, title: activeScenario.title });
          setView('debrief');
        }}
        onBack={handleBackToLibrary}
      />
    );
  }

  if (view === 'debrief' && debriefData) {
    return (
      <DebriefWorkspace
        scenario={debriefData.scenario}
        truthState={debriefData.truthState}
        observations={debriefData.observations}
        estimates={debriefData.estimates}
        onRetry={activeLesson ? handleRetry : handleRetryDrill}
        onBack={handleBackToLibrary}
      />
    );
  }

  return (
    <div className="app-loading">
      <h1>TMA Trainer</h1>
      <p>Loading...</p>
    </div>
  );
}
