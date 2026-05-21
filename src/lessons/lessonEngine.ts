import type { Lesson } from './schema';
import type { Scenario } from '../simulation/scenarioTypes';

/** Convert a Lesson into a runnable Scenario for the simulation engine. */
export function lessonToScenario(lesson: Lesson): Scenario {
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.summary,
    ownship: lesson.initialConditions.ownship,
    contacts: lesson.initialConditions.contacts,
    sensor: lesson.sensor,
    environment: {},
    tasks: lesson.tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
    })),
    hints: lesson.hints.map((h) => ({
      id: h.id,
      taskId: h.taskId,
      text: h.text,
      revealAfterSec: h.revealAfterSec,
    })),
    debriefRules: lesson.debriefRules,
    durationSec: 600, // Default 10 minutes for lessons
  };
}

/** Runtime state of a lesson in progress. */
export interface LessonRuntimeState {
  lessonId: string;
  currentTaskIndex: number;
  revealedHints: Set<string>;
  completed: boolean;
  startedAt: number;
}

/** Create fresh runtime state for a lesson. */
export function createRuntimeState(lesson: Lesson): LessonRuntimeState {
  return {
    lessonId: lesson.id,
    currentTaskIndex: 0,
    revealedHints: new Set(),
    completed: false,
    startedAt: Date.now(),
  };
}

/** Get the currently active task, if any. */
export function getCurrentTask(lesson: Lesson, state: LessonRuntimeState) {
  if (state.currentTaskIndex >= lesson.tasks.length) return null;
  return lesson.tasks[state.currentTaskIndex];
}

/** Advance to the next task. Returns false if already at the end. */
export function advanceTask(
  lesson: Lesson,
  state: LessonRuntimeState
): boolean {
  if (state.completed) return false;
  state.currentTaskIndex += 1;
  if (state.currentTaskIndex >= lesson.tasks.length) {
    state.completed = true;
  }
  return true;
}

/** Mark a lesson as completed manually (e.g. after debrief). */
export function completeLesson(
  lesson: Lesson,
  state: LessonRuntimeState
): void {
  state.completed = true;
  state.currentTaskIndex = lesson.tasks.length;
}

/** Reveal a hint by its id. */
export function revealHint(state: LessonRuntimeState, hintId: string): boolean {
  if (state.revealedHints.has(hintId)) return false;
  state.revealedHints.add(hintId);
  return true;
}

/** Get all hints for the current task. */
export function getCurrentTaskHints(lesson: Lesson, state: LessonRuntimeState) {
  const currentTask = getCurrentTask(lesson, state);
  if (!currentTask) return [];
  return lesson.hints.filter((h) => h.taskId === currentTask.id);
}
