"use client";

import { useState } from "react";
import CopyButton from "./CopyButton";

const VREW_URL = "https://vrew.ai/ko/";

interface VrewRecipeCardProps {
  copyText: string;
  hookSearchKeyword: string;
  painSearchKeyword: string;
  children: React.ReactNode;
}

export default function VrewRecipeCard({
  copyText,
  hookSearchKeyword,
  painSearchKeyword,
  children,
}: VrewRecipeCardProps) {
  const [showTips, setShowTips] = useState(false);

  return (
    <div className="rounded-xl border-2 border-black bg-zinc-50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-base font-black text-black">🎬 35초 영상 대본 → Vrew 조립 → 유튜브 업로드</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={copyText} label="Vrew용 자막 대본만 복사" />
          <a
            href={VREW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg border-2 border-black bg-yellow-400 px-4 py-2 text-center text-sm leading-tight font-bold text-black shadow transition active:scale-95"
          >
            🚀 1초 복사 후 Vrew 바로 열기 ↗
          </a>
        </div>
      </div>

      <div className="mb-3 rounded-lg border-2 border-black bg-white p-3">
        <ol className="flex flex-col gap-2 text-sm leading-snug text-black">
          <li>
            <StepRow number={1}>대본 복사 — Vrew에서 [텍스트로 비디오 만들기] 누르고 붙여넣기</StepRow>
          </li>
          <li className="flex flex-col gap-1.5">
            <StepRow number={2}>[삽입]→[무료 비디오]에서 추천 검색어로 배경 채우기</StepRow>
            <span className="ml-8 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
                0~5초: {hookSearchKeyword}
              </span>
              <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
                5~15초: {painSearchKeyword}
              </span>
            </span>
            <span className="ml-8 text-xs leading-relaxed text-zinc-600">
              💡 인물이 나오는 배경영상은 국내 정서와 안 맞을 수 있어요. 사물·풍경 위주 검색어를 우선 추천드려요.
            </span>
          </li>
          <li>
            <StepRow number={3}>
              조립 — 15~30초 시연: 내 폰 녹화 화면 얹고, 자막 위치를 화면 위/아래로 살짝 옮기면 끝!
            </StepRow>
          </li>
          <li>
            <StepRow number={4}>완성된 영상을 유튜브 스튜디오에 그대로 업로드!</StepRow>
          </li>
        </ol>

        <button
          type="button"
          onClick={() => setShowTips((v) => !v)}
          className="mt-3 w-full border-t border-black/10 pt-3 text-left text-xs font-bold text-zinc-600"
        >
          {showTips ? "▲" : "▼"} Vrew 처음이신가요? 30초 컨닝페이퍼
        </button>

        {showTips && (
          <div className="mt-2 flex flex-col gap-2 rounded-lg bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-700">
            <p>
              <strong className="text-black">목소리가 마음에 안 들 때</strong> → 오른쪽 위 성우 이름 클릭하고
              한국어 목소리 변경
            </p>
            <p>
              <strong className="text-black">자막 위치가 앱 시연을 가릴 때</strong> → 화면 자막을 마우스로 잡고
              화면 맨 아래나 위로 쓱 당기기
            </p>
          </div>
        )}
      </div>

      {children}
    </div>
  );
}

function StepRow({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xs font-black text-black">
        {number}
      </span>
      <span className="pt-0.5">{children}</span>
    </div>
  );
}
