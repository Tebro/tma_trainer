/**
 * Local persistence layer for user progress, settings, and attempt summaries.
 * All APIs are isolated from UI — they work with plain JSON.
 */

const PREFIX = 'tma-trainer';
const VERSION = 1;

export interface LessonProgressEntry {
  lessonId: string;
  completedAt: string; // ISO date string
  bestScore: number; // 0–1
  attempts: number;
}

export interface UserSettings {
  defaultSpeed: number;
  audioEnabled: boolean;
  theme: 'dark' | 'light';
}

export interface AttemptRecord {
  id: string;
  lessonId: string;
  timestamp: string;
  score: number;
  estimates: number;
}

// ── Keys ────────────────────────────────────────────────────────────────────

function key(name: string): string {
  return `${PREFIX}:${name}`;
}

// ── Version / Migration ─────────────────────────────────────────────────────

function checkVersion(): void {
  const stored = localStorage.getItem(key('version'));
  if (stored === null) {
    localStorage.setItem(key('version'), String(VERSION));
    return;
  }
  const v = Number.parseInt(stored, 10);
  if (v !== VERSION) {
    // Simple reset on major version change
    clearAll();
    localStorage.setItem(key('version'), String(VERSION));
  }
}

// Run on import but not during SSR
if (typeof window !== 'undefined') {
  checkVersion();
}

// ── Lesson Progress ─────────────────────────────────────────────────────────

export function getLessonProgress(): Record<string, LessonProgressEntry> {
  try {
    const raw = localStorage.getItem(key('lessonProgress'));
    return raw ? (JSON.parse(raw) as Record<string, LessonProgressEntry>) : {};
  } catch {
    return {};
  }
}

export function saveLessonProgress(entry: LessonProgressEntry): void {
  const all = getLessonProgress();
  const existing = all[entry.lessonId];
  all[entry.lessonId] = {
    ...entry,
    attempts: (existing?.attempts ?? 0) + 1,
    bestScore: existing
      ? Math.max(existing.bestScore, entry.bestScore)
      : entry.bestScore,
  };
  localStorage.setItem(key('lessonProgress'), JSON.stringify(all));
}

export function isLessonCompleted(lessonId: string): boolean {
  return lessonId in getLessonProgress();
}

// ── Settings ────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: UserSettings = {
  defaultSpeed: 1,
  audioEnabled: false,
  theme: 'dark',
};

export function getSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(key('settings'));
    return raw
      ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as UserSettings) }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<UserSettings>): void {
  const merged = { ...getSettings(), ...settings };
  localStorage.setItem(key('settings'), JSON.stringify(merged));
}

// ── Attempt History ─────────────────────────────────────────────────────────

export function getAttemptHistory(): AttemptRecord[] {
  try {
    const raw = localStorage.getItem(key('attempts'));
    return raw ? (JSON.parse(raw) as AttemptRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveAttempt(record: AttemptRecord): void {
  const all = getAttemptHistory();
  all.push(record);
  localStorage.setItem(key('attempts'), JSON.stringify(all));
}

// ── Clear ───────────────────────────────────────────────────────────────────

export function clearAll(): void {
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) {
      toRemove.push(k);
    }
  }
  for (const k of toRemove) {
    localStorage.removeItem(k);
  }
}
