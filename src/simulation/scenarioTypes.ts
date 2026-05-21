/**
 * Core simulation types for TMA Trainer.
 * Units: yards for distance, degrees true (0-360) for course, knots for speed, seconds for time.
 */

export interface Vector2 {
  x: number;
  y: number;
}

export type ContactCategory =
  | 'merchant'
  | 'submarine'
  | 'surface-combatant'
  | 'biologic'
  | 'unknown';

export type ClassificationAmbiguity = 'low' | 'medium' | 'high';

/** A scheduled course or speed change. */
export interface Maneuver {
  timeSec: number;
  course?: number;
  speed?: number;
}

/** The player's vessel. */
export interface Ownship {
  position: Vector2;
  course: number;
  speed: number;
  maneuvers?: Maneuver[];
}

/** A tracked or truth contact in the scenario. */
export interface Contact {
  id: string;
  category: ContactCategory;
  position: Vector2;
  course: number;
  speed: number;
  maneuvers?: Maneuver[];
  /** Optional fictional signature label for simplified sonar cues. */
  signature?: string;
  /** Optional predefined transient cues emitted by this contact. */
  emittedCues?: string[];
}

/** Sensor configuration for a scenario. */
export interface SensorSettings {
  bearingNoiseDeg: number;
  updateIntervalSec: number;
  classificationAmbiguity: ClassificationAmbiguity;
  contactDropouts?: Array<{
    contactId: string;
    startSec: number;
    endSec: number;
  }>;
}

/** Optional environment assumptions. */
export interface EnvironmentSettings {
  name?: string;
}

/** A task reference inside a scenario. */
export interface ScenarioTask {
  id: string;
  title: string;
  description: string;
}

/** A hint reference inside a scenario. */
export interface ScenarioHint {
  id: string;
  taskId?: string;
  text: string;
  revealAfterSec?: number;
}

/** A scoring rule used during debrief. */
export interface DebriefRule {
  metric: string;
  threshold: number;
  feedback: string;
}

/** A complete scenario definition for simulation and drills. */
export interface Scenario {
  id: string;
  title: string;
  description?: string;
  ownship: Ownship;
  contacts: Contact[];
  sensor: SensorSettings;
  environment?: EnvironmentSettings;
  tasks: ScenarioTask[];
  hints: ScenarioHint[];
  debriefRules: DebriefRule[];
  /** Total simulated duration in seconds. */
  durationSec: number;
}

export type ObservationConfidence = 'low' | 'medium' | 'high';
export type ObservationSource = 'sonar' | 'visual' | 'other';

/** A timestamped sensor observation. */
export interface Observation {
  timestampSec: number;
  bearingDeg: number;
  signalCue?: string;
  contactId: string;
  confidence: ObservationConfidence;
  source: ObservationSource;
}

export type EstimateConfidence = 'low' | 'medium' | 'high';

/** A user-submitted estimate at a point in time. */
export interface Estimate {
  timestampSec: number;
  contactId: string;
  rangeYds: number;
  course: number;
  speed: number;
  classification?: ContactCategory;
  confidence: EstimateConfidence;
  notes?: string;
}

/** A single score component in a debrief. */
export interface DebriefScoreComponent {
  metric: string;
  value: number;
  weight: number;
}

/** The result of comparing estimates against truth. */
export interface Debrief {
  scenarioId: string;
  timestampSec: number;
  scoreTotal: number;
  scoreComponents: DebriefScoreComponent[];
  estimates: Estimate[];
  truthAtTime: Record<string, Contact>;
  feedback: string[];
  errorHistory: Record<string, number[]>;
}
