import { Campaign, DailyMission } from "./types";

const CAMPAIGN_KEY = "pacemaker_campaign";
const MISSIONS_KEY = "pacemaker_missions";

export function loadCampaign(): Campaign | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CAMPAIGN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Campaign;
  } catch {
    return null;
  }
}

export function saveCampaign(campaign: Campaign): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(campaign));
  } catch {
    // localStorage unavailable — ignore
  }
}

export function clearCampaign(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CAMPAIGN_KEY);
    window.localStorage.removeItem(MISSIONS_KEY);
  } catch {
    // ignore
  }
}

export function loadMissions(): DailyMission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MISSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DailyMission[];
  } catch {
    return [];
  }
}

function saveMissions(missions: DailyMission[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MISSIONS_KEY, JSON.stringify(missions));
  } catch {
    // ignore
  }
}

export function getMission(day: number): DailyMission | undefined {
  return loadMissions().find((m) => m.day_number === day);
}

export function upsertMission(mission: DailyMission): void {
  const missions = loadMissions();
  const idx = missions.findIndex((m) => m.day_number === mission.day_number);
  if (idx >= 0) {
    missions[idx] = mission;
  } else {
    missions.push(mission);
  }
  saveMissions(missions);
}
