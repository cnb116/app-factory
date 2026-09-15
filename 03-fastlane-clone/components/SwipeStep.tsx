"use client";

import { useEffect, useRef, useState } from "react";
import { ScriptCard } from "@/lib/types";

interface SwipeStepProps {
  card: ScriptCard;
  index: number;
  total: number;
  onDecision: (accepted: boolean) => void;
}

export default function SwipeStep({ card, index, total, onDecision }: SwipeStepProps) {
  const [entered, setEntered] = useState(false);
  const decidedRef = useRef(false);

  useEffect(() => {
    decidedRef.current = false;
    setEntered(false);
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [card.id]);

  const handleDecision = (accepted: boolean) => {
    if (decidedRef.current) return;
    decidedRef.current = true;
    onDecision(accepted);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-6 pb-28">
      <p className="text-center text-base font-bold text-zinc-500">
        {index + 1} / {total}편 — 마음에 드는 대본만 고르세요
      </p>

      <div
        className={`flex flex-col gap-4 rounded-2xl border-2 border-black bg-white p-5 shadow-xl transition-all duration-200 ease-out ${
          entered ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"
        }`}
      >
        <span className="w-fit rounded-full bg-yellow-400 px-3 py-1 text-sm font-bold text-black">
          {card.hookType}
        </span>

        <div className="rounded-xl bg-black p-4 text-center">
          <p className="text-lg leading-snug font-black text-yellow-400">{card.thumbnailLine1}</p>
          <p className="text-lg leading-snug font-black text-yellow-400">{card.thumbnailLine2}</p>
        </div>

        <ScriptLine emoji="🎬" label="훅 (0~5초)" text={card.hookLine} />
        <ScriptLine emoji="😣" label="고통 자극 (5~15초)" text={card.painAgitation} />
        <ScriptLine emoji="🎥" label="시연 가이드 (15~30초)" text={card.demoGuide} />
        <ScriptLine emoji="📣" label="CTA (30~35초)" text={card.cta} />
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="button"
          onClick={() => handleDecision(false)}
          className="flex-1 rounded-xl border-2 border-black bg-white py-4 text-lg font-bold text-black shadow transition active:scale-95"
        >
          ❌ 거절
        </button>
        <button
          type="button"
          onClick={() => handleDecision(true)}
          className="flex-[1.4] rounded-xl bg-yellow-400 py-5 text-xl font-black text-black shadow-lg transition active:scale-95"
        >
          ⭕ 선택
        </button>
      </div>
    </div>
  );
}

function ScriptLine({ emoji, label, text }: { emoji: string; label: string; text: string }) {
  return (
    <div>
      <p className="text-sm font-bold text-zinc-500">
        {emoji} {label}
      </p>
      <p className="mt-1 text-base leading-relaxed text-black">{text}</p>
    </div>
  );
}
