"use client";

import CopyButton from "./CopyButton";

interface NaverBlogCardProps {
  naverPost: string;
  naverMetaDescription: string;
  keywords: string[];
  onCopied: () => void;
}

export default function NaverBlogCard({ naverPost, naverMetaDescription, keywords, onCopied }: NaverBlogCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border-2 border-black bg-white p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-yellow-400 px-3 py-1 text-sm font-bold whitespace-nowrap text-black">
          📝 네이버 블로그 (850자)
        </span>
        <CopyButton text={naverPost} label="전체 복사" onCopied={onCopied} />
      </div>

      <p className="whitespace-pre-line text-base leading-relaxed text-black">{naverPost}</p>

      <div className="rounded-xl bg-zinc-50 p-4">
        <p className="mb-1 text-sm font-bold text-zinc-500">SEO 메타 설명</p>
        <p className="text-sm leading-relaxed text-black">{naverMetaDescription}</p>
      </div>

      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <span key={kw} className="rounded-full border border-black px-3 py-1 text-xs font-bold text-black">
              #{kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
