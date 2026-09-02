"use client";

import { useEffect, useState } from "react";
import { Campaign, DailyMission, SHORT_CHANNEL_LABEL } from "@/lib/types";
import { getScenarioDay } from "@/lib/scenario";
import { getMission, loadMissions, upsertMission } from "@/lib/storage";
import { computeCurrentStreak, getLocalDateKey } from "@/lib/streak";

export default function ChannelCard({
  campaign,
  onCampaignChange,
  compact = false,
}: {
  campaign: Campaign;
  onCampaignChange: (campaign: Campaign) => void;
  compact?: boolean;
}) {
  const [mission, setMission] = useState<DailyMission | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const scenarioDay = getScenarioDay(campaign.current_day);
    const existing = getMission(campaign.id, campaign.current_day);

    if (existing) {
      setMission(existing);
      if (existing.generated_content.trim() === "") {
        void generateContent(existing);
      }
      return;
    }

    const fresh: DailyMission = {
      campaign_id: campaign.id,
      day_number: campaign.current_day,
      title: scenarioDay.title,
      instruction: scenarioDay.instruction,
      generated_content: "",
      is_completed: false,
    };
    upsertMission(fresh);
    setMission(fresh);
    void generateContent(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.id, campaign.current_day]);

  const generateContent = async (targetMission: DailyMission) => {
    setIsGenerating(true);
    try {
      const scenarioDay = getScenarioDay(targetMission.day_number);
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_type: campaign.channel_type,
          community_character: campaign.community_character,
          item_description: campaign.item_description,
          nickname: campaign.nickname,
          persona_role: campaign.persona_role,
          persona_tone: campaign.persona_tone,
          day: targetMission.day_number,
          phase: scenarioDay.phase,
          mission_title: targetMission.title,
          mission_instruction: targetMission.instruction,
        }),
      });
      const data = await response.json();

      if (!response.ok || typeof data.content !== "string") {
        throw new Error(data?.error || "생성 실패");
      }

      const updated: DailyMission = { ...targetMission, generated_content: data.content };
      upsertMission(updated);
      setMission(updated);
    } catch {
      alert(
        `[${SHORT_CHANNEL_LABEL[campaign.channel_type]}] 문구 생성에 실패했습니다. 잠시 후 다시 시도해주세요`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContentEdit = (value: string) => {
    if (!mission) return;
    const updated: DailyMission = { ...mission, generated_content: value };
    setMission(updated);
    upsertMission(updated);
  };

  const handleCopyAndOpen = async () => {
    if (!mission || mission.generated_content.trim() === "") {
      alert("복사할 문구가 없습니다");
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(mission.generated_content);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = mission.generated_content;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      alert("복사에 실패했습니다. 텍스트를 직접 선택해서 복사해주세요");
    }

    window.open(campaign.channel_url, "_blank", "noopener,noreferrer");
  };

  const handleCompleteMission = () => {
    if (!mission) return;

    const completedMission: DailyMission = {
      ...mission,
      is_completed: true,
      completed_at: getLocalDateKey(),
    };
    upsertMission(completedMission);

    const newStreak = computeCurrentStreak(loadMissions(campaign.id));

    onCampaignChange({
      ...campaign,
      current_day: campaign.current_day + 1,
      current_streak: newStreak,
      longest_streak: Math.max(campaign.longest_streak ?? 0, newStreak),
    });
  };

  const scenarioDay = getScenarioDay(campaign.current_day);
  const channelBadge = SHORT_CHANNEL_LABEL[campaign.channel_type];
  const streak = computeCurrentStreak(loadMissions(campaign.id));

  return (
    <div className={compact ? "rounded-2xl border-2 border-black p-3" : "flex flex-col gap-6"}>
      <div className="relative">
        {streak >= 2 && (
          <span
            className={`absolute -top-2 -right-2 z-10 rounded-full px-2 py-0.5 text-xs font-bold shadow ${
              streak >= 3 ? "bg-yellow-400 text-black" : "bg-zinc-200 text-zinc-700"
            }`}
          >
            {streak >= 3 ? `🔥 D+${streak}일 연속 실행 중!` : `${streak}일째`}
          </span>
        )}
        <div className={compact ? "rounded-xl bg-black px-3 py-3 text-center" : "rounded-2xl bg-black px-4 py-4 text-center"}>
          <p className={compact ? "text-base font-bold text-yellow-400 sm:text-lg" : "text-lg font-bold text-yellow-400 sm:text-2xl"}>
            [{campaign.title}] {compact ? `(${channelBadge}) ` : ""}침투 D+{campaign.current_day}일차 : {scenarioDay.title}
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-300">단계: {scenarioDay.phase}</p>
        </div>
      </div>

      <div className={compact ? "mt-3 rounded-xl border-2 border-zinc-200 p-3" : "rounded-2xl border-2 border-black p-4"}>
        {!compact && <h2 className="text-lg font-bold text-black">오늘의 미션 가이드</h2>}
        <p className={compact ? "text-base leading-relaxed text-zinc-700" : "mt-2 text-lg leading-relaxed text-zinc-700"}>
          {mission?.instruction ?? scenarioDay.instruction}
        </p>

        {!compact && <h2 className="mt-4 text-lg font-bold text-black">복붙용 문구</h2>}
        <textarea
          value={isGenerating ? "문구 생성 중..." : (mission?.generated_content ?? "")}
          onChange={(e) => handleContentEdit(e.target.value)}
          disabled={isGenerating}
          className={
            compact
              ? "mt-2 min-h-20 w-full rounded-lg border-2 border-black p-2 text-base leading-relaxed text-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
              : "mt-2 min-h-32 w-full rounded-xl border-2 border-black p-3 text-lg leading-relaxed text-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
          }
        />
        <button
          type="button"
          onClick={() => mission && generateContent(mission)}
          disabled={isGenerating}
          className="mt-2 text-base font-bold text-zinc-500 underline disabled:opacity-40"
        >
          문구 다시 생성하기
        </button>
      </div>

      <div className={compact ? "mt-3 flex flex-col gap-2" : "flex flex-col gap-6"}>
        <button
          type="button"
          onClick={handleCopyAndOpen}
          disabled={isGenerating}
          className={
            compact
              ? "min-h-14 w-full rounded-xl bg-yellow-400 py-3 text-lg font-extrabold text-black shadow transition active:scale-95 disabled:opacity-40"
              : "min-h-14 w-full rounded-2xl bg-yellow-400 py-4 text-xl font-extrabold text-black shadow-lg transition active:scale-95 disabled:opacity-40"
          }
        >
          {copied ? "복사됨! ✓ 새 창 여는 중..." : "문구 복사하고 커뮤니티로 이동"}
        </button>

        <button
          type="button"
          onClick={handleCompleteMission}
          className={
            compact
              ? "min-h-14 w-full rounded-xl bg-black py-3 text-lg font-extrabold text-yellow-400 shadow transition active:scale-95"
              : "min-h-14 w-full rounded-2xl bg-black py-4 text-xl font-extrabold text-yellow-400 shadow-lg transition active:scale-95"
          }
        >
          오늘 미션 완료 도장 쾅!
        </button>
      </div>
    </div>
  );
}
