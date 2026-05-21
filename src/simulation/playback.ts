import type { Observation, Scenario } from './scenarioTypes';
import { ObservationGenerator } from './observations';
import { computeEntityState, type EntityState } from './tracks';

/** Truth state for every entity at a single moment in simulated time. */
export interface TruthSnapshot {
  timestampSec: number;
  ownship: EntityState;
  contacts: Record<string, EntityState>;
}

/** Playback speed multipliers. */
export type PlaybackSpeed = 0 | 0.25 | 0.5 | 1 | 2 | 4 | 8;

const VALID_SPEEDS: PlaybackSpeed[] = [0, 0.25, 0.5, 1, 2, 4, 8];

/** Domain-only scenario playback controller. No React or DOM dependencies. */
export class ScenarioPlayback {
  private scenario: Scenario;
  private observationGen: ObservationGenerator;
  private readonly seed: string | number | undefined;

  private _currentTime: number;
  private _speed: PlaybackSpeed;
  private _isPlaying: boolean;
  private _timerId: ReturnType<typeof setInterval> | null = null;

  constructor(scenario: Scenario, seed?: string | number) {
    this.scenario = scenario;
    this.seed = seed;
    this.observationGen = new ObservationGenerator(scenario, seed);
    this._currentTime = 0;
    this._speed = 1;
    this._isPlaying = false;
  }

  /** Replace the active scenario while preserving current playback time. */
  updateScenario(scenario: Scenario): void {
    this.scenario = scenario;
    this.observationGen = new ObservationGenerator(scenario, this.seed);
    this.setTime(this._currentTime);
  }

  // ── Playback Controls ─────────────────────────────────────────────────────

  /** Start automatic time advancement. */
  play(): void {
    if (this._isPlaying || this._speed === 0) return;
    this._isPlaying = true;
    // Tick every 1 real second = _speed simulated seconds
    this._timerId = setInterval(() => {
      this.step(1);
    }, 1000);
  }

  /** Pause automatic time advancement. */
  pause(): void {
    this._isPlaying = false;
    if (this._timerId !== null) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
  }

  /** Toggle between play and pause. */
  toggle(): void {
    if (this._isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /** Advance simulated time by `deltaSec` seconds. */
  step(deltaSec: number): void {
    this.setTime(this._currentTime + deltaSec * this._speed);
  }

  /** Jump simulation to an absolute time (clamped to [0, durationSec]). */
  setTime(timeSec: number): void {
    this._currentTime = Math.max(
      0,
      Math.min(timeSec, this.scenario.durationSec)
    );
  }

  /** Reset to the start of the scenario. */
  reset(): void {
    this.pause();
    this._currentTime = 0;
  }

  // ── Speed ─────────────────────────────────────────────────────────────────

  /** Set playback speed multiplier. Passing an invalid value is ignored. */
  setSpeed(speed: PlaybackSpeed): void {
    if (!VALID_SPEEDS.includes(speed)) return;
    const wasPlaying = this._isPlaying;
    this.pause();
    this._speed = speed;
    if (wasPlaying && speed !== 0) {
      this.play();
    }
  }

  nextSpeed(): void {
    const idx = VALID_SPEEDS.indexOf(this._speed);
    const next = VALID_SPEEDS[Math.min(idx + 1, VALID_SPEEDS.length - 1)];
    this.setSpeed(next);
  }

  prevSpeed(): void {
    const idx = VALID_SPEEDS.indexOf(this._speed);
    const prev = VALID_SPEEDS[Math.max(idx - 1, 0)];
    this.setSpeed(prev);
  }

  // ── Read-only State ───────────────────────────────────────────────────────

  get currentTime(): number {
    return this._currentTime;
  }

  get speed(): PlaybackSpeed {
    return this._speed;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get durationSec(): number {
    return this.scenario.durationSec;
  }

  get scenarioId(): string {
    return this.scenario.id;
  }

  // ── Truth State Lookup ────────────────────────────────────────────────────

  /**
   * Compute the true positions and kinematics of every entity
   * at the current simulated time.
   */
  getTruthState(): TruthSnapshot {
    return {
      timestampSec: this._currentTime,
      ownship: computeEntityState(this.scenario.ownship, this._currentTime),
      contacts: this.scenario.contacts.reduce<Record<string, EntityState>>(
        (acc, contact) => {
          acc[contact.id] = computeEntityState(contact, this._currentTime);
          return acc;
        },
        {}
      ),
    };
  }

  /**
   * Compute truth state for an arbitrary timestamp (useful for debriefs).
   */
  getTruthStateAt(timestampSec: number): TruthSnapshot {
    const clamped = Math.max(
      0,
      Math.min(timestampSec, this.scenario.durationSec)
    );
    return {
      timestampSec: clamped,
      ownship: computeEntityState(this.scenario.ownship, clamped),
      contacts: this.scenario.contacts.reduce<Record<string, EntityState>>(
        (acc, contact) => {
          acc[contact.id] = computeEntityState(contact, clamped);
          return acc;
        },
        {}
      ),
    };
  }

  // ── Observation Lookup ────────────────────────────────────────────────────

  /**
   * Generate observations for the current simulated time.
   * Returns an empty array if the current time does not land on
   * an update interval.
   */
  getObservations(): Observation[] {
    return this.observationGen.generate(this._currentTime);
  }

  /** All observations from t=0 up to the current time. */
  getObservationsUpToCurrent(): Array<{
    timestampSec: number;
    observations: Observation[];
  }> {
    const results: Array<{
      timestampSec: number;
      observations: Observation[];
    }> = [];
    const interval = this.scenario.sensor.updateIntervalSec;
    const count = Math.floor(this._currentTime / interval) + 1;

    for (let i = 0; i < count; i++) {
      const t = i * interval;
      results.push({
        timestampSec: t,
        observations: this.observationGen.generate(t),
      });
    }

    return results;
  }

  /** Dispose any active timers. Call before discarding the instance. */
  dispose(): void {
    this.pause();
  }
}
