"use client";

// 결과 화면 단순화(2026-09-25) — 유튜브 쇼츠 단일 경로만 노출. 인스타/틱톡 버튼은 목록에서 삭제하지 않고
// SHOW_ALL_UPLOAD_LINKS 플래그로만 걸러둠 — true로 되돌리면 즉시 다시 노출된다.
const SHOW_ALL_UPLOAD_LINKS = false;

const UPLOAD_LINKS = [
  { label: "유튜브 스튜디오", emoji: "▶️", url: "https://studio.youtube.com" },
  { label: "인스타 크리에이터 스튜디오", emoji: "📸", url: "https://business.facebook.com/creatorstudio" },
  { label: "틱톡 업로드", emoji: "🎵", url: "https://www.tiktok.com/creator-center/upload" },
];

export default function UploadLinkButtons() {
  const visibleLinks = SHOW_ALL_UPLOAD_LINKS ? UPLOAD_LINKS : UPLOAD_LINKS.filter((link) => link.url.includes("youtube"));

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {visibleLinks.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-lg border-2 border-black bg-white px-3 py-2 text-center text-sm leading-tight font-bold text-black shadow transition active:scale-95"
        >
          {link.emoji} {link.label}
          <br />
          바로가기 ↗
        </a>
      ))}
    </div>
  );
}
