import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Estimate, Scenario, Vector2 } from '../simulation/scenarioTypes';
import { ScenarioPlayback } from '../simulation/playback';
import { generateDebrief } from '../scoring/estimateScoring';
import { generateSonarCue } from '../simulation/sonarCues';
import { saveAttempt } from '../storage/progress';
import { TacticalPlot } from '../components/TacticalPlot';
import { ContactPanel } from '../components/ContactPanel';
import { EstimateForm } from '../components/EstimateForm';
import { PlaybackControls } from '../components/PlaybackControls';

interface Props {
  scenario: Scenario;
  seed: string;
  onFinish: (data: {
    scenario: Scenario;
    truthState: import('../simulation/playback').TruthSnapshot;
    observations: Array<{
      timestampSec: number;
      observations: import('../simulation/scenarioTypes').Observation[];
    }>;
    estimates: Estimate[];
  }) => void;
  onBack: () => void;
}

function generateAttemptId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function DrillWorkspace({ scenario, seed, onFinish, onBack }: Props) {
  const [workingScenario, setWorkingScenario] = useState(scenario);
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
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [maneuverCourse, setManeuverCourse] = useState(() =>
    String(Math.round(scenario.ownship.course))
  );
  const [maneuverSpeed, setManeuverSpeed] = useState(() =>
    String(scenario.ownship.speed)
  );
  const [maneuverLog, setManeuverLog] = useState<
    Array<{ timeSec: number; course: number; speed: number }>
  >([]);
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
      if (playback.currentTime >= workingScenario.durationSec) {
        setIsPlaying(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, playback, workingScenario.durationSec, syncPlayback]);

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
    setWorkingScenario(scenario);
    playback.updateScenario(scenario);
    playback.reset();
    setEstimates([]);
    setPlotPick(null);
    setManeuverLog([]);
    setActiveContactId(null);
    syncPlayback();
  }, [playback, scenario, syncPlayback]);

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
      if (timeSec >= workingScenario.durationSec) setIsPlaying(false);
      syncPlayback();
    },
    [playback, workingScenario.durationSec, syncPlayback]
  );

  const handleSubmitEstimate = useCallback((estimate: Estimate) => {
    setEstimates((prev) => [...prev, estimate]);
  }, []);

  const handleFinishDrill = useCallback(() => {
    const debrief = generateDebrief(workingScenario, estimates);

    saveAttempt({
      id: generateAttemptId(),
      lessonId: workingScenario.id,
      timestamp: new Date().toISOString(),
      score: debrief.scoreTotal,
      estimates: estimates.length,
    });

    onFinish({
      scenario: workingScenario,
      truthState: playback.getTruthState(),
      observations: playback.getObservationsUpToCurrent(),
      estimates,
    });
  }, [workingScenario, estimates, onFinish, playback]);

  const handleExecuteManeuver = useCallback(() => {
    const course = Number.parseFloat(maneuverCourse);
    const speed = Number.parseFloat(maneuverSpeed);
    if (Number.isNaN(course) || Number.isNaN(speed) || speed < 0) return;

    const nextScenario: Scenario = {
      ...workingScenario,
      ownship: {
        ...workingScenario.ownship,
        maneuvers: [
          ...(workingScenario.ownship.maneuvers ?? []),
          {
            timeSec: playback.currentTime,
            course: ((course % 360) + 360) % 360,
            speed,
          },
        ],
      },
    };
    setWorkingScenario(nextScenario);
    setManeuverLog((prev) => [
      ...prev,
      {
        timeSec: playback.currentTime,
        course: ((course % 360) + 360) % 360,
        speed,
      },
    ]);
    playback.updateScenario(nextScenario);
    syncPlayback();
  }, [maneuverCourse, maneuverSpeed, playback, syncPlayback, workingScenario]);

  // Computed
  const flatObservations = useMemo(
    () => observations.flatMap((o) => o.observations),
    [observations]
  );

  const contactOptions = useMemo(
    () =>
      workingScenario.contacts.map((c) => ({
        id: c.id,
        label: c.id,
      })),
    [workingScenario]
  );

  const isTwoContact = workingScenario.contacts.length === 2;
  const currentContactId = activeContactId ?? contactOptions[0]?.id ?? '';
  const currentSonarCue = useMemo(() => {
    const latestObs = flatObservations
      .filter((o) => o.contactId === currentContactId)
      .pop();
    if (!latestObs) return null;
    const contact = workingScenario.contacts.find(
      (c) => c.id === currentContactId
    );
    if (!contact) return null;
    return generateSonarCue(
      latestObs.contactId,
      contact.category,
      contact.signature,
      workingScenario.sensor.classificationAmbiguity,
      seed,
      latestObs.timestampSec
    );
  }, [flatObservations, currentContactId, workingScenario, seed]);

  return (
    <div className="app-workspace">
      <header className="app-header">
        <h1>TMA Trainer — {workingScenario.title}</h1>
        <button className="app-header__back" onClick={onBack} type="button">
          Library
        </button>
      </header>

      <main className="app-main">
        {/* Drill Info Panel */}
        <aside className="panel panel-lesson">
          <div className="drill-panel">
            <h2 className="drill-panel__title">{workingScenario.title}</h2>
            <p className="drill-panel__meta">
              Contacts: {workingScenario.contacts.length} | Duration:{' '}
              {Math.floor(workingScenario.durationSec / 60)}m
            </p>
            <p className="drill-panel__meta">
              Sensor: {workingScenario.sensor.bearingNoiseDeg}° noise,{' '}
              {workingScenario.sensor.updateIntervalSec}s interval
            </p>

            <div className="drill-maneuver">
              <h4>Maneuver Ownship</h4>
              <label>
                Course
                <input
                  type="number"
                  min={0}
                  max={359}
                  value={maneuverCourse}
                  onChange={(event) => setManeuverCourse(event.target.value)}
                />
              </label>
              <label>
                Speed
                <input
                  type="number"
                  min={0}
                  value={maneuverSpeed}
                  onChange={(event) => setManeuverSpeed(event.target.value)}
                />
              </label>
              <button type="button" onClick={handleExecuteManeuver}>
                Execute Now
              </button>
              {maneuverLog.length > 0 && (
                <div className="drill-maneuver__log">
                  <h5>Maneuver Log</h5>
                  {maneuverLog.map((entry, index) => (
                    <div key={`${entry.timeSec}-${index}`}>
                      T+{formatTime(entry.timeSec)}: course{' '}
                      {Math.round(entry.course).toString().padStart(3, '0')}°,
                      speed {entry.speed.toFixed(1)} kt
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="drill-panel__actions">
              <button
                className="drill-panel__finish"
                onClick={handleFinishDrill}
                type="button"
              >
                Finish & Debrief
              </button>
            </div>

            {estimates.length > 0 && (
              <div className="drill-panel__estimates">
                <h4>Submitted ({estimates.length})</h4>
                {estimates.map((e, i) => (
                  <div key={i} className="drill-panel__estimate">
                    <span>{e.contactId}</span>
                    <span>R={Math.round(e.rangeYds)}yd</span>
                    <span>C={Math.round(e.course)}°</span>
                    <span>S={e.speed}kt</span>
                    {e.classification && <span>[{e.classification}]</span>}
                  </div>
                ))}
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
            ownshipTrack={workingScenario.ownship}
            showPossiblePositions={workingScenario.contacts.length === 1}
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
            updateIntervalSec={workingScenario.sensor.updateIntervalSec}
          />

          {contactOptions.length > 0 && (
            <EstimateForm
              contactId={currentContactId}
              contactOptions={isTwoContact ? contactOptions : undefined}
              showClassification={isTwoContact}
              sonarCue={isTwoContact ? currentSonarCue : undefined}
              suggestedRangeYds={plotPick?.rangeYds ?? null}
              timestampSec={playback.currentTime}
              previousEstimates={estimates.filter(
                (e) => e.contactId === currentContactId
              )}
              onSubmit={handleSubmitEstimate}
              onChangeContact={isTwoContact ? setActiveContactId : undefined}
            />
          )}
        </aside>
      </main>

      {/* Controls */}
      <footer className="app-footer">
        <PlaybackControls
          elapsedSec={playback.currentTime}
          durationSec={workingScenario.durationSec}
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
          timelineStepSec={workingScenario.sensor.updateIntervalSec}
        />
      </footer>
    </div>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
