"use client";

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
  return (
    <div className="rounded-xl bg-zinc-50 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-zinc-500">🎬 35초 영상 대본</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={copyText} label="Vrew용 자막 대본만 복사" />
          <a
            href={VREW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg border-2 border-black bg-yellow-400 px-4 py-2 text-center text-sm leading-tight font-bold text-black shadow transition active:scale-95"
          >
            Vrew 열기 ↗
          </a>
        </div>
      </div>

      <div className="mb-3 rounded-lg border-2 border-black bg-white p-3">
        <p className="mb-2 text-sm font-bold text-black">💡 Vrew 초간단 3단계 조립</p>
        <ol className="flex flex-col gap-2 text-sm leading-snug text-black">
          <li>① 대본 붙여넣기 → AI 목소리+자막 1초 완성</li>
          <li className="flex flex-col gap-1.5">
            <span>② [삽입]→[무료 비디오]로 0~15초 채우기</span>
            <span className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
                0~5초 검색어: {hookSearchKeyword}
              </span>
              <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
                5~15초 검색어: {painSearchKeyword}
              </span>
            </span>
          </li>
          <li>③ 15~30초 → 내 앱/화면 실제 녹화 클립 삽입</li>
        </ol>
        <div className="mt-3 flex flex-col gap-1 border-t border-black/10 pt-3 text-xs leading-snug text-zinc-600">
          <p>💡 클립이 단 3개로 생성되어 음성이 부드럽게 이어집니다.</p>
          <p>💡 자막 줄바꿈은 Vrew 화면에서 글자가 길 경우 자막을 클릭해 Enter 한 번만 치시면 됩니다.</p>
        </div>
      </div>

      {children}
    </div>
  );
}
