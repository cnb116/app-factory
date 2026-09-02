"use client";

import { getTimeline } from "@/lib/scenario";
import { DailyMission } from "@/lib/types";

export default function Timeline({
  currentDay,
  missions,
}: {
  currentDay: number;
  missions: DailyMission[];
}) {
  const days = getTimeline();

  const isCompleted = (day: number) => {
    const mission = missions.find((m) => m.day_number === day);
    if (mission?.is_completed) return true;
    return day < currentDay;
  };

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-bold text-black">14일 계정 숙성 타임라인</h2>
      <div className="grid grid-cols-7 gap-2">
        {days.map(({ day, phase }) => {
          const done = isCompleted(day);
          const isToday = day === currentDay;
          return (
            <div
              key={day}
              title={`D+${day} · ${phase}`}
              className={`flex min-h-14 flex-col items-center justify-center rounded-lg border-2 text-center ${
                isToday
                  ? "border-black bg-yellow-400 text-black"
                  : done
                    ? "border-black bg-black text-yellow-400"
                    : "border-zinc-300 bg-white text-zinc-400"
              }`}
            >
              <span className="text-sm font-bold">D{day}</span>
              <span className="text-base">{done ? "✓" : "·"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
