"use client";

import { ScriptCard } from "@/lib/types";
import CopyButton from "./CopyButton";
import PremiumCapsule from "./PremiumCapsule";
import UploadLinkButtons from "./UploadLinkButtons";
import VrewRecipeCard from "./VrewRecipeCard";

interface PackageStepProps {
  cards: ScriptCard[];
  onRestart: () => void;
}

function buildFullScript(card: ScriptCard): string {
  return [
    `[훅 0~5초]\n${card.hookLine}`,
    `[고통 자극 5~15초]\n${card.painAgitation}`,
    `[시연 가이드 15~30초]\n${card.demoGuide}`,
    `[CTA 30~35초]\n${card.cta}`,
  ].join("\n\n");
}

// Vrew 등 자막 편집 프로그램에 그대로 붙여넣을 실제 대사만 추출 (연출 지시문인 demoGuide는 제외, 시간 라벨도 제외)
function buildVrewScript(card: ScriptCard): string {
  return [card.hookLine, card.painAgitation, card.cta].join("\n\n");
}

function buildCaptionBlock(card: ScriptCard): string {
  return `${card.caption}\n\n${card.hashtags.join(" ")}`;
}

export default function PackageStep({ cards, onRestart }: PackageStepProps) {
  if (cards.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-5 py-10 text-center">
        <p className="text-xl font-bold text-black">선택한 대본이 없습니다.</p>
        <button
          type="button"
          onClick={onRestart}
          className="rounded-xl bg-black px-6 py-4 text-lg font-bold text-yellow-400 shadow transition active:scale-95"
        >
          처음부터 다시하기
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-6 pb-28">
      <div className="text-center">
        <h2 className="text-2xl font-black text-black">선택한 대본 {cards.length}편</h2>
        <p className="mt-1 text-base text-zinc-600">항목마다 복사해서 바로 쓰세요</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <PremiumCapsule
          description="03호기 프로 패스 (대본 10종 무제한 + 3대 채널 배포 패키징)"
          price="월 9,900원"
          subtext="1인 창업자·개발자를 위한 무제한 숏폼 마케팅 엔진"
        />
        <span className="rounded-full bg-yellow-400 px-4 py-1.5 text-center text-sm font-bold text-black">
          🎉 [오픈 기념] 지금은 전 기능 100% 무료 이용 가능
        </span>
      </div>

      {cards.map((card, i) => (
        <div key={card.id} className="flex flex-col gap-4 rounded-2xl border-2 border-black bg-white p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-yellow-400 px-3 py-1 text-sm font-bold text-black">
              {i + 1}편 · {card.hookType}
            </span>
          </div>

          <PackageSection
            title="🖼️ 0초 썸네일 문구"
            copyText={`${card.thumbnailLine1}\n${card.thumbnailLine2}`}
            copyLabel="0초 썸네일 카피만 복사"
          >
            <p className="text-lg leading-snug font-black text-black">{card.thumbnailLine1}</p>
            <p className="text-lg leading-snug font-black text-black">{card.thumbnailLine2}</p>
          </PackageSection>

          <VrewRecipeCard
            copyText={buildVrewScript(card)}
            hookSearchKeyword={card.hookSearchKeyword}
            painSearchKeyword={card.painSearchKeyword}
          >
            <p className="whitespace-pre-line text-base leading-relaxed text-black">
              {buildFullScript(card)}
            </p>
          </VrewRecipeCard>

          <PackageSection
            title="✍️ 캡션 + 해시태그"
            copyText={buildCaptionBlock(card)}
            copyLabel="유튜브/릴스/틱톡 본문+태그만 복사"
          >
            <p className="text-base leading-relaxed text-black">{card.caption}</p>
            <p className="mt-2 text-sm text-zinc-600">{card.hashtags.join(" ")}</p>
            <UploadLinkButtons />
          </PackageSection>
        </div>
      ))}

      <button
        type="button"
        onClick={onRestart}
        className="w-full rounded-xl border-2 border-black bg-white py-4 text-lg font-bold text-black shadow transition active:scale-95"
      >
        처음부터 다시하기
      </button>
    </div>
  );
}

function PackageSection({
  title,
  copyText,
  copyLabel,
  children,
}: {
  title: string;
  copyText: string;
  copyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-zinc-50 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-zinc-500">{title}</p>
        <CopyButton text={copyText} label={copyLabel} />
      </div>
      {children}
    </div>
  );
}
