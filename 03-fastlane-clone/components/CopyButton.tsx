"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
  /** 왕버튼 규격 — 채널별 원클릭 복사처럼 화면에서 가장 중요한 단일 액션일 때 사용 */
  big?: boolean;
}

export default function CopyButton({ text, label = "복사", big = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (text.trim() === "") return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("[CopyButton] copy failed", err);
    }
  };

  if (big) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        className="w-full rounded-xl bg-yellow-400 py-4 text-lg font-black text-black shadow-lg transition active:scale-95"
      >
        {copied ? "복사됨! ✓" : `📋 ${label}`}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded-lg bg-black px-4 py-2 text-center text-sm leading-tight font-bold text-yellow-400 shadow transition active:scale-95"
    >
      {copied ? "복사됨! ✓" : `📋 ${label}`}
    </button>
  );
}
