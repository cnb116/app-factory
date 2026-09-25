"use client";

import { useRef, useState } from "react";

interface ImagePickerProps {
  topic: string;
  imageDataUrl: string | null;
  onImageChange: (dataUrl: string | null) => void;
}

type ImageMode = "ai" | "upload";

export default function ImagePicker({ topic, imageDataUrl, onImageChange }: ImagePickerProps) {
  const [mode, setMode] = useState<ImageMode>("ai");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateImage = async () => {
    if (topic.trim() === "") {
      setError("먼저 주제를 입력해주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();

      if (!res.ok || !data?.imageBase64) {
        setError(data?.error || "이미지 생성에 실패했습니다.");
        setLoading(false);
        return;
      }

      onImageChange(`data:${data.mimeType};base64,${data.imageBase64}`);
    } catch (err) {
      console.error("[ImagePicker] 이미지 생성 실패", err);
      setError("잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => onImageChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  const switchMode = (next: ImageMode) => {
    setMode(next);
    setError(null);
    onImageChange(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => switchMode("ai")}
          className={`flex-1 rounded-xl border-2 border-black py-3 text-sm font-bold transition ${
            mode === "ai" ? "bg-black text-yellow-400" : "bg-white text-black"
          }`}
        >
          🎨 AI로 이미지 생성
        </button>
        <button
          type="button"
          onClick={() => switchMode("upload")}
          className={`flex-1 rounded-xl border-2 border-black py-3 text-sm font-bold transition ${
            mode === "upload" ? "bg-black text-yellow-400" : "bg-white text-black"
          }`}
        >
          🖼️ 내 사진 업로드
        </button>
      </div>

      {mode === "ai" ? (
        <button
          type="button"
          onClick={generateImage}
          disabled={loading}
          className="w-full rounded-xl border-2 border-black bg-white py-4 text-base font-bold text-black shadow transition active:scale-95 disabled:opacity-50"
        >
          {loading ? "이미지 생성 중..." : "🎨 이미지 생성하기"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-xl border-2 border-black bg-white py-4 text-base font-bold text-black shadow transition active:scale-95"
        >
          🖼️ 사진 선택하기
        </button>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {error && <p className="text-sm font-bold text-red-600">{error}</p>}

      {imageDataUrl && (
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-black bg-zinc-50 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageDataUrl} alt="대표 이미지 미리보기" className="max-h-48 w-full rounded-lg object-cover" />
          <a
            href={imageDataUrl}
            download="thumbnail.png"
            className="w-full rounded-lg bg-black py-2 text-center text-sm font-bold text-yellow-400 transition active:scale-95"
          >
            ⬇️ 이미지 다운로드
          </a>
        </div>
      )}
    </div>
  );
}
