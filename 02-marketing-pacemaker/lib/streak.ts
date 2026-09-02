import { DailyMission } from "./types";

export function getLocalDateKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function daysBetween(laterKey: string, earlierKey: string): number {
  const later = new Date(`${laterKey}T00:00:00`).getTime();
  const earlier = new Date(`${earlierKey}T00:00:00`).getTime();
  return Math.round((later - earlier) / (24 * 60 * 60 * 1000));
}

/**
 * Consecutive-day streak ending at the most recent completion.
 * Skipping a full calendar day (no completion at all that day) breaks the streak.
 * Multiple completions on the same day only count once.
 */
export function computeCurrentStreak(missions: DailyMission[]): number {
  const dateKeys = Array.from(
    new Set(
      missions
        .filter((m) => m.is_completed && m.completed_at)
        .map((m) => m.completed_at as string)
    )
  ).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

  if (dateKeys.length === 0) return 0;

  const mostRecent = dateKeys[0];
  const gapFromToday = daysBetween(getLocalDateKey(), mostRecent);
  if (gapFromToday > 1) return 0;

  let streak = 1;
  let cursor = mostRecent;
  for (let i = 1; i < dateKeys.length; i++) {
    const diff = daysBetween(cursor, dateKeys[i]);
    if (diff === 1) {
      streak++;
      cursor = dateKeys[i];
    } else {
      break;
    }
  }
  return streak;
}
