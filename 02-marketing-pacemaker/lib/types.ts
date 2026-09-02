export type ChannelType = "CAFE" | "BAND" | "OPENCHAT";
export type CampaignStatus = "ACTIVE" | "PAUSED" | "COMPLETED";

export interface CampaignGroup {
  id: string;
  nickname: string;
  item_description: string;
  persona_role: string;
  persona_tone: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  group_id: string;
  title: string;
  item_description: string;
  channel_type: ChannelType;
  channel_url: string;
  community_character: string;
  nickname: string;
  persona_role: string;
  persona_tone: string;
  current_day: number;
  status: CampaignStatus;
  created_at: string;
}

export interface PersonaOption {
  role: string;
  tone: string;
}

export interface ItemCategoryOption {
  value: string;
  label: string;
  hint: string;
}

export const ITEM_CATEGORY_OPTIONS: ItemCategoryOption[] = [
  { value: "TIME", label: "시간과 수고를 덜어줘요", hint: "편리함 · 시간 절약" },
  { value: "MONEY", label: "돈을 아끼거나 벌게 도와줘요", hint: "경제성 · 가성비" },
  { value: "HEALTH", label: "건강 관리에 도움돼요", hint: "건강 · 웰빙" },
  { value: "FAMILY", label: "육아·가족 생활이 편해져요", hint: "육아 · 가족" },
  { value: "BEAUTY", label: "외모·스타일 관리에 도움돼요", hint: "뷰티 · 스타일" },
  { value: "MOOD", label: "기분 전환·힐링에 도움돼요", hint: "스트레스 해소" },
  { value: "GROWTH", label: "배우고 성장하는 데 도움돼요", hint: "자기계발" },
  { value: "ETC", label: "기타", hint: "직접 입력" },
];

export interface DailyMission {
  campaign_id: string;
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

export const SHORT_CHANNEL_LABEL: Record<ChannelType, string> = {
  CAFE: "카페",
  BAND: "밴드",
  OPENCHAT: "오픈채팅",
};
