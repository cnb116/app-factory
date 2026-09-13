const DAILY_FREE_LIMIT = 3;
const STORAGE_KEY = "textCleanerUsage";

type Usage = { date: string; count: number };

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function readUsage(): Usage {
  if (typeof window === "undefined") {
    return { date: getTodayKey(), count: 0 };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: getTodayKey(), count: 0 };
    const parsed = JSON.parse(raw) as Usage;
    if (parsed.date !== getTodayKey()) {
      return { date: getTodayKey(), count: 0 };
    }
    return parsed;
  } catch {
    return { date: getTodayKey(), count: 0 };
  }
}

export const DAILY_FREE_LIMIT_COUNT = DAILY_FREE_LIMIT;

export function getRemainingFreeUses(): number {
  return Math.max(0, DAILY_FREE_LIMIT - readUsage().count);
}

export function consumeFreeUse(): number {
  const usage = readUsage();
  const next: Usage = { date: getTodayKey(), count: usage.count + 1 };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private mode, etc.) — proceed without persisting
  }
  return Math.max(0, DAILY_FREE_LIMIT - next.count);
}
