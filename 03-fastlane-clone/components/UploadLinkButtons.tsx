"use client";

const UPLOAD_LINKS = [
  { label: "유튜브 스튜디오", emoji: "▶️", url: "https://studio.youtube.com" },
  { label: "인스타 크리에이터 스튜디오", emoji: "📸", url: "https://business.facebook.com/creatorstudio" },
  { label: "틱톡 업로드", emoji: "🎵", url: "https://www.tiktok.com/creator-center/upload" },
];

export default function UploadLinkButtons() {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {UPLOAD_LINKS.map((link) => (
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
