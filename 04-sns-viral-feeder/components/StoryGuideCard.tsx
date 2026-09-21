"use client";

import CopyButton from "./CopyButton";
import { STORY_LINK_LABEL, STORY_LINK_URL } from "@/lib/types";

interface StoryGuideCardProps {
  storySticker: string;
  onCopied: () => void;
}

export default function StoryGuideCard({ storySticker, onCopied }: StoryGuideCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border-2 border-black bg-white p-5 shadow-xl">
      <span className="w-fit rounded-full bg-yellow-400 px-3 py-1 text-sm font-bold text-black">
        📸 인스타 스토리 세팅 가이드
      </span>

      <StoryRow title="텍스트 스티커 문구" value={storySticker} copyLabel="문구 복사" onCopied={onCopied} />
      <StoryRow title="링크 스티커 URL" value={STORY_LINK_URL} copyLabel="URL 복사" onCopied={onCopied} />
      <StoryRow title="링크 스티커 라벨" value={STORY_LINK_LABEL} copyLabel="라벨 복사" onCopied={onCopied} />
    </div>
  );
}

function StoryRow({
  title,
  value,
  copyLabel,
  onCopied,
}: {
  title: string;
  value: string;
  copyLabel: string;
  onCopied: () => void;
}) {
  return (
    <div className="rounded-xl bg-zinc-50 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-zinc-500">{title}</p>
        <CopyButton text={value} label={copyLabel} onCopied={onCopied} />
      </div>
      <p className="text-base leading-relaxed break-all text-black">{value}</p>
    </div>
  );
}
