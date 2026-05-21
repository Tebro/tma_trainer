import type { Lesson } from './schema';
import { validateLesson } from './lessonValidation';
import bearingOnlyAmbiguity from '../../content/lessons/bearing-only-ambiguity.json';
import bearingRate from '../../content/lessons/bearing-rate.json';
import ownshipManeuvering from '../../content/lessons/ownship-maneuvering.json';

const LESSON_MODULES: Record<string, unknown> = {
  'bearing-only-ambiguity': bearingOnlyAmbiguity,
  'bearing-rate': bearingRate,
  'ownship-maneuvering': ownshipManeuvering,
};

/** Load a lesson by its ID. Validates and throws on error. */
export function loadLessonById(id: string): Lesson {
  const raw = LESSON_MODULES[id];
  if (!raw) {
    throw new Error(`Unknown lesson id: "${id}"`);
  }
  const lesson = raw as Lesson;
  const result = validateLesson(lesson);
  if (!result.valid) {
    throw new Error(`Lesson validation failed: ${result.errors.join('; ')}`);
  }
  return lesson;
}

/** Load all available lessons. */
export function loadAllLessons(): Lesson[] {
  return getAvailableLessonIds().map((id) => loadLessonById(id));
}

/** List available lesson IDs. */
export function getAvailableLessonIds(): string[] {
  return Object.keys(LESSON_MODULES);
}
