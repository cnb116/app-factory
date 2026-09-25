"use client";

import CopyButton from "./CopyButton";

interface WordpressBlogCardProps {
  wordpressPost: string;
  wordpressSeoTitle: string;
  wordpressMetaDescription: string;
  onCopied: () => void;
}

export default function WordpressBlogCard({
  wordpressPost,
  wordpressSeoTitle,
  wordpressMetaDescription,
  onCopied,
}: WordpressBlogCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border-2 border-black bg-white p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-yellow-400 px-3 py-1 text-sm font-bold whitespace-nowrap text-black">
          🌐 워드프레스 (1500자)
        </span>
        <CopyButton text={wordpressPost} label="전체 복사" onCopied={onCopied} />
      </div>

      <p className="whitespace-pre-line font-mono text-xs leading-relaxed break-all text-black">{wordpressPost}</p>

      <div className="rounded-xl bg-zinc-50 p-4">
        <p className="mb-1 text-sm font-bold text-zinc-500">SEO 타이틀 태그 (60자 이내)</p>
        <p className="mb-3 text-sm leading-relaxed text-black">{wordpressSeoTitle}</p>
        <p className="mb-1 text-sm font-bold text-zinc-500">메타 디스크립션 (155자 이내)</p>
        <p className="text-sm leading-relaxed text-black">{wordpressMetaDescription}</p>
      </div>
    </div>
  );
}
