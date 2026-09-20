// 이용 정책: 일반 방문자는 브라우저(localStorage) 기준 1회 무료 체험 후 결제 유도.
// `?pass=free7day` 매직 링크로 들어오면 7일간 무제한(1회 제한 무시). 만료되면
// 자동으로 일반 모드(1회 제한)로 복귀 — 별도 서버 저장/로그인 없이 순수
// localStorage 기준이라 브라우저를 바꾸거나 데이터를 지우면 다시 1회를 준다.

const TRIAL_USED_KEY = "fastlane_trial_used";
const MAGIC_PASS_KEY = "free_trial_until";
const MAGIC_PASS_DAYS = 7;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function readLocalStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // localStorage 사용 불가(프라이빗 모드 등) — 조용히 무시
  }
}

function removeLocalStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function hasUsedFreeTrial(): boolean {
  return readLocalStorage(TRIAL_USED_KEY) === "1";
}

export function markFreeTrialUsed(): void {
  writeLocalStorage(TRIAL_USED_KEY, "1");
}

/** 매직 패스 만료 타임스탬프(ms). 이미 지났으면 저장값을 정리하고 null을 반환한다. */
export function getMagicPassExpiry(): number | null {
  const raw = readLocalStorage(MAGIC_PASS_KEY);
  if (!raw) return null;

  const expiry = Number(raw);
  if (!Number.isFinite(expiry) || Date.now() >= expiry) {
    removeLocalStorage(MAGIC_PASS_KEY);
    return null;
  }
  return expiry;
}

export function activateMagicPass(days: number = MAGIC_PASS_DAYS): number {
  const expiry = Date.now() + days * ONE_DAY_MS;
  writeLocalStorage(MAGIC_PASS_KEY, String(expiry));
  return expiry;
}

export function hasUnlimitedAccess(): boolean {
  return getMagicPassExpiry() !== null;
}

/** 남은 일수(올림). 매직 패스가 없거나 만료됐으면 null. */
export function getMagicPassDaysRemaining(): number | null {
  const expiry = getMagicPassExpiry();
  if (expiry === null) return null;
  return Math.ceil((expiry - Date.now()) / ONE_DAY_MS);
}

export function canGenerate(): boolean {
  return hasUnlimitedAccess() || !hasUsedFreeTrial();
}
