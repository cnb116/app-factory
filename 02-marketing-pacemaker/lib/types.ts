export type ChannelType = "CAFE" | "BAND" | "OPENCHAT";
export type CampaignStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

export interface Campaign {
  id: string;
  title: string;
  item_description: string;
  channel_type: ChannelType;
  channel_url: string;
  community_character: string;
  nickname: string;
  current_day: number;
  status: CampaignStatus;
  created_at: string;
}

export interface DailyMission {
  day_number: number;
  title: string;
  instruction: string;
  generated_content: string;
  is_completed: boolean;
}

export const CHANNEL_LABEL: Record<ChannelType, string> = {
  CAFE: "네이버 카페",
  BAND: "밴드",
  OPENCHAT: "오픈채팅",
};
