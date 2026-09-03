"use client";

import { getTimeline } from "@/lib/scenario";
import { loadMissions, upsertMission } from "@/lib/storage";
import { computeCurrentStreak } from "@/lib/streak";
import { Campaign, DailyMission } from "@/lib/types";

export default function Timeline({
  campaign,
  missions,
  onCampaignChange,
}: {
  campaign: Campaign;
  missions: DailyMission[];
  onCampaignChange: (campaign: Campaign) => void;
}) {
  const days = getTimeline();
  const currentDay = campaign.current_day;

  const isCompleted = (day: number) => {
    const mission = missions.find((m) => m.day_number === day);
    if (mission?.is_completed) return true;
    return day < currentDay;
  };

  const handleUndo = (day: number) => {
    const confirmed = window.confirm(
      `D+${day} 완료를 취소할까요? 이후 진행 상황도 함께 초기화됩니다.`
    );
    if (!confirmed) return;

    loadMissions(campaign.id)
      .filter((m) => m.day_number >= day)
      .forEach((m) => upsertMission({ ...m, is_completed: false, completed_at: undefined }));

    const newStreak = computeCurrentStreak(loadMissions(campaign.id));
    onCampaignChange({ ...campaign, current_day: day, current_streak: newStreak });
  };

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-bold text-black">14일 계정 숙성 타임라인</h2>
      <div className="grid grid-cols-7 gap-2">
        {days.map(({ day, phase }) => {
          const done = isCompleted(day);
          const isToday = day === currentDay;
          const undoable = done && !isToday;
          return (
            <button
              key={day}
              type="button"
              onClick={undoable ? () => handleUndo(day) : undefined}
              disabled={!undoable}
              title={undoable ? `D+${day} · ${phase} · 클릭해서 완료 취소` : `D+${day} · ${phase}`}
              className={`flex min-h-14 flex-col items-center justify-center rounded-lg border-2 text-center ${
                isToday
                  ? "border-black bg-yellow-400 text-black"
                  : done
                    ? "border-black bg-black text-yellow-400"
                    : "border-zinc-300 bg-white text-zinc-400"
              } ${undoable ? "cursor-pointer active:scale-95" : "cursor-default"}`}
            >
              <span className="text-sm font-bold">D{day}</span>
              <span className="text-base">{done ? "✓" : "·"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
