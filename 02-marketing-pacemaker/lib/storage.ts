import { Campaign, CampaignGroup, DailyMission } from "./types";

const GROUP_KEY = "pacemaker_group";
const CAMPAIGNS_KEY = "pacemaker_campaigns";
const MISSIONS_KEY = "pacemaker_missions_v2";

// Legacy single-channel keys (pre multi-channel). Kept only for migration.
const LEGACY_CAMPAIGN_KEY = "pacemaker_campaign";
const LEGACY_MISSIONS_KEY = "pacemaker_missions";

function readJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable — ignore
  }
}

/**
 * Older versions stored a single Campaign under `pacemaker_campaign`.
 * On first load after upgrading, wrap it into a one-channel CampaignGroup
 * so existing users keep their progress with no manual action.
 */
function migrateLegacyIfNeeded(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(GROUP_KEY)) return;

  const legacyRaw = window.localStorage.getItem(LEGACY_CAMPAIGN_KEY);
  if (!legacyRaw) return;

  try {
    const legacy = JSON.parse(legacyRaw);

    const group: CampaignGroup = {
      id: crypto.randomUUID(),
      nickname: legacy.nickname ?? "",
      item_description: legacy.item_description ?? "",
      persona_role: legacy.persona_role ?? "",
      persona_tone: legacy.persona_tone ?? "",
      created_at: legacy.created_at ?? new Date().toISOString(),
    };

    const campaign: Campaign = { ...legacy, group_id: group.id };

    writeJSON(GROUP_KEY, group);
    writeJSON(CAMPAIGNS_KEY, [campaign]);

    const legacyMissionsRaw = window.localStorage.getItem(LEGACY_MISSIONS_KEY);
    if (legacyMissionsRaw) {
      const legacyMissions = JSON.parse(legacyMissionsRaw) as Array<
        Omit<DailyMission, "campaign_id">
      >;
      const migrated: DailyMission[] = legacyMissions.map((m) => ({
        ...m,
        campaign_id: campaign.id,
      }));
      writeJSON(MISSIONS_KEY, migrated);
    }

    window.localStorage.removeItem(LEGACY_CAMPAIGN_KEY);
    window.localStorage.removeItem(LEGACY_MISSIONS_KEY);
  } catch {
    // malformed legacy data — leave onboarding to start fresh
  }
}

export function loadGroup(): CampaignGroup | null {
  migrateLegacyIfNeeded();
  return readJSON<CampaignGroup>(GROUP_KEY);
}

export function saveGroup(group: CampaignGroup): void {
  writeJSON(GROUP_KEY, group);
}

export function loadCampaigns(): Campaign[] {
  migrateLegacyIfNeeded();
  return readJSON<Campaign[]>(CAMPAIGNS_KEY) ?? [];
}

export function saveCampaigns(campaigns: Campaign[]): void {
  writeJSON(CAMPAIGNS_KEY, campaigns);
}

export function upsertCampaign(campaign: Campaign): void {
  const campaigns = loadCampaigns();
  const idx = campaigns.findIndex((c) => c.id === campaign.id);
  if (idx >= 0) {
    campaigns[idx] = campaign;
  } else {
    campaigns.push(campaign);
  }
  saveCampaigns(campaigns);
}

export function clearAll(): void {
  if (typeof window === "undefined") return;
  for (const key of [GROUP_KEY, CAMPAIGNS_KEY, MISSIONS_KEY, LEGACY_CAMPAIGN_KEY, LEGACY_MISSIONS_KEY]) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

export function loadMissions(campaignId?: string): DailyMission[] {
  const all = readJSON<DailyMission[]>(MISSIONS_KEY) ?? [];
  return campaignId ? all.filter((m) => m.campaign_id === campaignId) : all;
}

export function getMission(campaignId: string, day: number): DailyMission | undefined {
  return loadMissions(campaignId).find((m) => m.day_number === day);
}

export function upsertMission(mission: DailyMission): void {
  const all = readJSON<DailyMission[]>(MISSIONS_KEY) ?? [];
  const idx = all.findIndex(
    (m) => m.campaign_id === mission.campaign_id && m.day_number === mission.day_number
  );
  if (idx >= 0) {
    all[idx] = mission;
  } else {
    all.push(mission);
  }
  writeJSON(MISSIONS_KEY, all);
}
