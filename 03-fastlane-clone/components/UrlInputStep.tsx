"use client";

import { useState } from "react";

interface UrlInputStepProps {
  onSubmit: (url: string) => void;
  loading: boolean;
  loadingLabel: string;
  error: string | null;
}

export default function UrlInputStep({ onSubmit, loading, loadingLabel, error }: UrlInputStepProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() === "" || loading) return;
    onSubmit(url.trim());
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-5 py-10 pb-28">
      <div className="text-center">
        <h1 className="text-3xl font-black text-black">숏폼 대본 공장</h1>
        <p className="mt-3 text-lg text-zinc-600">
          URL 하나만 넣으면, 바로 찍을 수 있는
          <br />
          바이럴 숏폼 대본 10편을 만들어드려요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="분석할 URL을 입력하세요 (상세페이지, 블로그 등)"
          disabled={loading}
          required
          className="w-full rounded-xl border-2 border-black px-4 py-4 text-lg text-black outline-none disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={loading || url.trim() === ""}
          className="w-full rounded-xl bg-black py-4 text-xl font-bold text-yellow-400 shadow transition active:scale-95 disabled:opacity-40"
        >
          {loading ? loadingLabel : "숏폼 콘텐츠 분석 시작"}
        </button>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-center text-base font-semibold text-red-700">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
