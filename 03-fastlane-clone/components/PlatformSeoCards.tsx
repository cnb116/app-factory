"use client";

import { ScriptCard } from "@/lib/types";
import CopyButton from "./CopyButton";

function buildYoutubeBlock(card: ScriptCard): string {
  const { seoTitle, seoDescription, tags } = card.youtubeSeo;
  return `${seoTitle}\n\n${seoDescription}\n\n${tags.join(", ")}`;
}

function buildInstagramBlock(card: ScriptCard): string {
  const { firstLine, body, hashtags } = card.instagramSeo;
  return `${firstLine}\n\n${body}\n\n${hashtags.join(" ")}`;
}

function buildTiktokBlock(card: ScriptCard): string {
  const { seoCaption, hashtags } = card.tiktokSeo;
  return `${seoCaption}\n\n${hashtags.join(" ")}`;
}

export default function PlatformSeoCards({ card }: { card: ScriptCard }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold text-zinc-500">📦 채널별 SEO 메타데이터 (검색 최적화)</p>

      <PlatformCard label="유튜브 쇼츠 전용" emoji="▶️" copyText={buildYoutubeBlock(card)}>
        <MetaRow title="SEO 제목" value={card.youtubeSeo.seoTitle} />
        <MetaRow title="설명란" value={card.youtubeSeo.seoDescription} />
        <MetaRow title="태그" value={card.youtubeSeo.tags.join(", ")} />
      </PlatformCard>

      <PlatformCard label="인스타그램 릴스 전용" emoji="📸" copyText={buildInstagramBlock(card)}>
        <MetaRow title="첫 줄 카피" value={card.instagramSeo.firstLine} />
        <MetaRow title="본문" value={card.instagramSeo.body} />
        <MetaRow title="해시태그" value={card.instagramSeo.hashtags.join(" ")} />
      </PlatformCard>

      <PlatformCard label="틱톡 전용" emoji="🎵" copyText={buildTiktokBlock(card)}>
        <MetaRow title="검색 최적화 캡션" value={card.tiktokSeo.seoCaption} />
        <MetaRow title="키워드 태그" value={card.tiktokSeo.hashtags.join(" ")} />
      </PlatformCard>
    </div>
  );
}

function PlatformCard({
  label,
  emoji,
  copyText,
  children,
}: {
  label: string;
  emoji: string;
  copyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border-2 border-black bg-white p-4">
      <span className="mb-3 inline-block w-fit rounded-full bg-black px-3 py-1 text-xs font-bold text-yellow-400">
        {emoji} [{label}]
      </span>
      <div className="flex flex-col gap-2">{children}</div>
      <div className="mt-3">
        <CopyButton text={copyText} label="원클릭 복사" big />
      </div>
    </div>
  );
}

function MetaRow({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-zinc-500">{title}</p>
      <p className="text-sm leading-relaxed text-black">{value}</p>
    </div>
  );
}
