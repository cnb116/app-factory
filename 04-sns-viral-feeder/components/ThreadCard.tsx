"use client";

import CopyButton from "./CopyButton";

interface ThreadCardProps {
  threadPost: string;
  onCopied: () => void;
}

export default function ThreadCard({ threadPost, onCopied }: ThreadCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-black bg-white p-5 shadow-xl">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-yellow-400 px-3 py-1 text-sm font-bold text-black">
          🧵 스레드 맞춤 원고
        </span>
        <CopyButton text={threadPost} label="원클릭 복사" onCopied={onCopied} />
      </div>
      <p className="whitespace-pre-line text-base leading-relaxed text-black">{threadPost}</p>
    </div>
  );
}
