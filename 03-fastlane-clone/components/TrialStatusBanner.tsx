"use client";

interface TrialStatusBannerProps {
  daysRemaining: number | null;
}

export default function TrialStatusBanner({ daysRemaining }: TrialStatusBannerProps) {
  if (daysRemaining === null) return null;

  return (
    <div className="w-full bg-yellow-400 px-4 py-2 text-center text-sm font-bold text-black sm:text-base">
      🎉 김반장 7일 무료 이용권 적용 중 (D-{daysRemaining}일 남음)
    </div>
  );
}
