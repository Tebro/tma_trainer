import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Estimate, Vector2 } from '../simulation/scenarioTypes';
import { ScenarioPlayback } from '../simulation/playback';
import {
  completeLesson,
  createRuntimeState,
  getCurrentTask,
  getCurrentTaskHints,
  lessonToScenario,
  revealHint,
} from '../lessons/lessonEngine';
import { generateDebrief } from '../scoring/estimateScoring';
import type { Lesson } from '../lessons/schema';
import { saveAttempt, saveLessonProgress } from '../storage/progress';
import { TacticalPlot } from '../components/TacticalPlot';
import { ContactPanel } from '../components/ContactPanel';
import { EstimateForm } from '../components/EstimateForm';
import { PlaybackControls } from '../components/PlaybackControls';

interface Props {
  lesson: Lesson;
  seed: string;
  onFinish: (
    score: number,
    data: {
      scenario: ReturnType<typeof lessonToScenario>;
      truthState: import('../simulation/playback').TruthSnapshot;
      observations: Array<{
        timestampSec: number;
        observations: import('../simulation/scenarioTypes').Observation[];
      }>;
      estimates: Estimate[];
    }
  ) => void;
  onBack: () => void;
}

function generateAttemptId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function LessonWorkspace({ lesson, seed, onFinish, onBack }: Props) {
  const [scenario] = useState(() => lessonToScenario(lesson));
  const [playback] = useState(() => new ScenarioPlayback(scenario, seed));
  const [truthState, setTruthState] = useState(() => playback.getTruthState());
  const [observations, setObservations] = useState(() =>
    playback.getObservationsUpToCurrent()
  );
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [plotPick, setPlotPick] = useState<{
    position: Vector2;
    rangeYds: number;
  } | null>(null);
  const [runtimeState, setRuntimeState] = useState(() =>
    createRuntimeState(lesson)
  );
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  // Dispose on unmount
  useEffect(() => {
    return () => {
      playback.dispose();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playback]);

  // Sync helper
  const syncPlayback = useCallback(() => {
    setTruthState(playback.getTruthState());
    setObservations(playback.getObservationsUpToCurrent());
  }, [playback]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;
    lastFrameRef.current = null;

    function tick(nowMs: number) {
      if (lastFrameRef.current !== null) {
        playback.step((nowMs - lastFrameRef.current) / 1000);
      }
      lastFrameRef.current = nowMs;
      syncPlayback();
      if (playback.currentTime >= scenario.durationSec) {
        setIsPlaying(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, playback, scenario.durationSec, syncPlayback]);

  // Handlers
  const handleStep = useCallback(
    (deltaSec: number) => {
      playback.setTime(playback.currentTime + deltaSec);
      syncPlayback();
    },
    [playback, syncPlayback]
  );

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    playback.reset();
    setEstimates([]);
    setPlotPick(null);
    setRuntimeState(createRuntimeState(lesson));
    syncPlayback();
  }, [playback, lesson, syncPlayback]);

  const handleSetSpeed = useCallback(
    (speed: 0 | 0.25 | 0.5 | 1 | 2 | 4 | 8) => {
      playback.setSpeed(speed);
      if (speed === 0) setIsPlaying(false);
      syncPlayback();
    },
    [playback, syncPlayback]
  );

  const handleSeek = useCallback(
    (timeSec: number) => {
      playback.setTime(timeSec);
      if (timeSec >= scenario.durationSec) setIsPlaying(false);
      syncPlayback();
    },
    [playback, scenario.durationSec, syncPlayback]
  );

  const handleAdvanceTask = useCallback(() => {
    setRuntimeState((prev) => {
      const nextIndex = prev.currentTaskIndex + 1;
      return {
        ...prev,
        currentTaskIndex: nextIndex,
        completed: nextIndex >= lesson.tasks.length,
      };
    });
  }, [lesson.tasks.length]);

  const handleRevealHint = useCallback((hintId: string) => {
    setRuntimeState((prev) => {
      const next = { ...prev };
      revealHint(next, hintId);
      return next;
    });
  }, []);

  const handleSubmitEstimate = useCallback((estimate: Estimate) => {
    setEstimates((prev) => [...prev, estimate]);
  }, []);

  const handleFinishLesson = useCallback(() => {
    setRuntimeState((prev) => {
      const next = { ...prev };
      completeLesson(lesson, next);
      return next;
    });

    const debrief = generateDebrief(scenario, estimates);

    saveLessonProgress({
      lessonId: lesson.id,
      completedAt: new Date().toISOString(),
      bestScore: debrief.scoreTotal,
      attempts: 1,
    });

    saveAttempt({
      id: generateAttemptId(),
      lessonId: lesson.id,
      timestamp: new Date().toISOString(),
      score: debrief.scoreTotal,
      estimates: estimates.length,
    });

    onFinish(debrief.scoreTotal, {
      scenario,
      truthState: playback.getTruthState(),
      observations: playback.getObservationsUpToCurrent(),
      estimates,
    });
  }, [scenario, estimates, lesson, onFinish, playback]);

  // Computed
  const currentTask = useMemo(
    () => getCurrentTask(lesson, runtimeState),
    [lesson, runtimeState]
  );

  const currentHints = useMemo(
    () => getCurrentTaskHints(lesson, runtimeState),
    [lesson, runtimeState]
  );

  const flatObservations = useMemo(
    () => observations.flatMap((o) => o.observations),
    [observations]
  );

  const showEstimateForm = currentTask?.description
    .toLowerCase()
    .includes('estimate');

  return (
    <div className="app-workspace">
      <header className="app-header">
        <h1>TMA Trainer — {lesson.title}</h1>
        <button className="app-header__back" onClick={onBack} type="button">
          Library
        </button>
      </header>

      <main className="app-main">
        {/* Lesson Panel */}
        <aside className="panel panel-lesson">
          <div className="lesson-panel">
            <h2 className="lesson-panel__title">{lesson.title}</h2>
            <p className="lesson-panel__summary">{lesson.summary}</p>

            <div className="lesson-panel__objectives">
              <h3>Objectives</h3>
              <ul>
                {lesson.objectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>

            <div className="lesson-panel__progress">
              Task {runtimeState.currentTaskIndex + 1} of {lesson.tasks.length}
            </div>

            {currentTask && (
              <div className="lesson-task">
                <h4 className="lesson-task__title">{currentTask.title}</h4>
                <p className="lesson-task__description">
                  {currentTask.description}
                </p>
                {lesson.id === 'bearing-only-ambiguity' && (
                  <div className="lesson-task__callout">
                    Under-constrained: bearing gives direction only. Range,
                    course, and speed are still hypotheses until you collect
                    more geometry.
                  </div>
                )}
                <button
                  className="lesson-task__btn"
                  onClick={handleAdvanceTask}
                  type="button"
                >
                  {runtimeState.currentTaskIndex < lesson.tasks.length - 1
                    ? 'Next Task'
                    : 'Finish Lesson'}
                </button>
              </div>
            )}

            {!currentTask && (
              <div className="lesson-complete">
                <p>All tasks complete!</p>
                <button
                  className="lesson-task__btn"
                  onClick={handleFinishLesson}
                  type="button"
                >
                  View Debrief
                </button>
              </div>
            )}

            {currentHints.length > 0 && (
              <div className="lesson-hints">
                <h4>Hints</h4>
                {currentHints.map((hint) => {
                  const isRevealed = runtimeState.revealedHints.has(hint.id);
                  return (
                    <div key={hint.id} className="lesson-hint">
                      {isRevealed ? (
                        <p className="lesson-hint__text">{hint.text}</p>
                      ) : (
                        <button
                          className="lesson-hint__reveal"
                          onClick={() => handleRevealHint(hint.id)}
                          type="button"
                        >
                          Show Hint
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Tactical Plot */}
        <section className="panel panel-plot">
          <TacticalPlot
            ownship={truthState.ownship}
            contactTruth={truthState.contacts}
            observations={flatObservations}
            estimates={estimates}
            ownshipTrack={scenario.ownship}
            showPossiblePositions={lesson.id === 'bearing-only-ambiguity'}
            hypothesisPoint={plotPick?.position ?? null}
            onCursorPick={(pick) =>
              setPlotPick({ position: pick.position, rangeYds: pick.rangeYds })
            }
            currentTimeSec={playback.currentTime}
            showTruth={false}
          />
        </section>

        {/* Right Panel */}
        <aside className="panel panel-contacts">
          <ContactPanel
            observations={flatObservations}
            currentTimeSec={playback.currentTime}
            updateIntervalSec={scenario.sensor.updateIntervalSec}
          />

          {showEstimateForm && flatObservations.length > 0 && (
            <EstimateForm
              contactId={flatObservations[0].contactId}
              suggestedRangeYds={plotPick?.rangeYds ?? null}
              timestampSec={playback.currentTime}
              previousEstimates={estimates}
              onSubmit={handleSubmitEstimate}
            />
          )}
        </aside>
      </main>

      {/* Controls */}
      <footer className="app-footer">
        <PlaybackControls
          elapsedSec={playback.currentTime}
          durationSec={scenario.durationSec}
          isPlaying={isPlaying}
          speed={playback.speed}
          onPlay={() => {
            setIsPlaying(true);
            syncPlayback();
          }}
          onPause={() => {
            setIsPlaying(false);
            syncPlayback();
          }}
          onStep={handleStep}
          onSeek={handleSeek}
          onReset={handleReset}
          onSetSpeed={handleSetSpeed}
          timelineStepSec={scenario.sensor.updateIntervalSec}
        />
      </footer>
    </div>
  );
}
