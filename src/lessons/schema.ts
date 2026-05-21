import type {
  Ownship,
  Contact,
  SensorSettings,
  DebriefRule,
} from '../simulation/scenarioTypes';

export type Difficulty = 'intro' | 'easy' | 'normal' | 'hard';

export interface Task {
  id: string;
  title: string;
  description: string;
  requiresEstimate?: boolean;
  requiresManeuver?: boolean;
}

export interface Hint {
  id: string;
  taskId?: string;
  text: string;
  revealAfterSec?: number;
  revealOnFailure?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  summary?: string;
  difficulty: Difficulty;
  objectives: string[];
  initialConditions: {
    ownship: Ownship;
    contacts: Contact[];
  };
  sensor: SensorSettings;
  tasks: Task[];
  hints: Hint[];
  debriefRules: DebriefRule[];
  tags?: string[];
}
