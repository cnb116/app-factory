"use client";

import CopyButton from "./CopyButton";

interface TextCardProps {
  icon: string;
  title: string;
  text: string;
  copyLabel?: string;
  onCopied: () => void;
}

export default function TextCard({ icon, title, text, copyLabel = "원클릭 복사", onCopied }: TextCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-black bg-white p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-yellow-400 px-3 py-1 text-sm font-bold whitespace-nowrap text-black">
          {icon} {title}
        </span>
        <CopyButton text={text} label={copyLabel} onCopied={onCopied} />
      </div>
      <p className="whitespace-pre-line text-base leading-relaxed text-black">{text}</p>
    </div>
  );
}
