"use client";

import { useState } from "react";
import { Campaign, CampaignGroup, ChannelType, PersonaOption } from "@/lib/types";
import { saveCampaigns, saveGroup } from "@/lib/storage";
import { detectChannelType, normalizeUrl } from "@/lib/channelDetect";

const CHANNEL_OPTIONS: { value: ChannelType; label: string }[] = [
  { value: "CAFE", label: "네이버 카페" },
  { value: "BAND", label: "밴드" },
  { value: "OPENCHAT", label: "오픈채팅" },
];

const DEFAULT_NICKNAMES = ["이웃", "구독자", "새내기", "동네친구"];

function defaultCommunityCharacter(channelType: ChannelType): string {
  const label = CHANNEL_OPTIONS.find((c) => c.value === channelType)?.label ?? "커뮤니티";
  return `정보 공유가 활발한 일반적인 ${label} 분위기`;
}

export default function OnboardingLite({
  onCreated,
}: {
  onCreated: (group: CampaignGroup, campaigns: Campaign[]) => void;
}) {
  const [url, setUrl] = useState("");
  const [needsChannelPick, setNeedsChannelPick] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const startWithChannel = async (channelType: ChannelType, normalizedUrl: string) => {
    setIsSubmitting(true);
    setError("");
    try {
      const community_character = defaultCommunityCharacter(channelType);

      let personaRole = "";
      let personaTone = "";
      try {
        const response = await fetch("/api/generate-persona-options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel_type: channelType, community_character }),
        });
        const data = await response.json();
        const first: PersonaOption | undefined = Array.isArray(data.personas)
          ? data.personas[0]
          : undefined;
        if (first) {
          personaRole = first.role;
          personaTone = first.tone;
        }
      } catch {
        // 페르소나 추천 실패해도 진행 — 대시보드에서 언제든 직접 채울 수 있음
      }

      const nickname = DEFAULT_NICKNAMES[Math.floor(Math.random() * DEFAULT_NICKNAMES.length)];
      const now = new Date().toISOString();
      const channelLabel = CHANNEL_OPTIONS.find((c) => c.value === channelType)?.label ?? "내 커뮤니티";

      const group: CampaignGroup = {
        id: crypto.randomUUID(),
        nickname,
        item_description: "",
        persona_role: personaRole,
        persona_tone: personaTone,
        created_at: now,
      };

      const campaign: Campaign = {
        id: crypto.randomUUID(),
        group_id: group.id,
        title: channelLabel,
        item_description: "",
        channel_type: channelType,
        channel_url: normalizedUrl,
        community_character,
        nickname,
        persona_role: personaRole,
        persona_tone: personaTone,
        current_day: 1,
        status: "ACTIVE",
        current_streak: 0,
        longest_streak: 0,
        created_at: now,
      };

      saveGroup(group);
      saveCampaigns([campaign]);
      onCreated(group, [campaign]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStart = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("커뮤니티 링크를 입력해주세요");
      return;
    }
    const normalized = normalizeUrl(trimmed);
    const detected = detectChannelType(normalized);
    if (detected) {
      void startWithChannel(detected, normalized);
    } else {
      setNeedsChannelPick(true);
    }
  };

  const handlePickChannel = (channelType: ChannelType) => {
    void startWithChannel(channelType, normalizeUrl(url.trim()));
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-10 sm:px-8">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <h1 className="text-center text-2xl font-extrabold text-black sm:text-3xl">
          마케팅 페이스메이커
        </h1>
        <p className="text-center text-lg text-zinc-500">
          커뮤니티 링크 하나만 입력하면 바로 시작할 수 있어요
        </p>

        <div className="flex flex-col gap-2">
          <input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setNeedsChannelPick(false);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleStart();
            }}
            placeholder="https://cafe.naver.com/..."
            disabled={isSubmitting}
            className="min-h-14 w-full rounded-xl border-2 border-black px-4 text-lg text-black focus:outline-none focus:ring-4 focus:ring-yellow-400 disabled:opacity-60"
          />
          {error && <p className="text-sm font-bold text-red-500">{error}</p>}
        </div>

        {needsChannelPick && !isSubmitting && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-zinc-500">
              어떤 유형의 커뮤니티인지 확인이 필요해요
            </p>
            <div className="grid grid-cols-3 gap-3">
              {CHANNEL_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => handlePickChannel(c.value)}
                  className="min-h-14 rounded-xl border-2 border-black px-2 text-base font-bold text-black transition active:scale-95"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!needsChannelPick && (
          <button
            type="button"
            onClick={handleStart}
            disabled={isSubmitting}
            className="min-h-14 w-full rounded-2xl bg-black py-4 text-xl font-extrabold text-yellow-400 shadow-lg transition active:scale-95 disabled:opacity-40"
          >
            {isSubmitting ? "커뮤니티 분석 중..." : "시작하기"}
          </button>
        )}
      </div>
    </div>
  );
}
