"use client";

import { useState } from "react";
import { ViralFeed } from "@/lib/types";
import ThreadCard from "@/components/ThreadCard";
import StoryGuideCard from "@/components/StoryGuideCard";
import Toast from "@/components/Toast";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<ViralFeed | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = () => {
    setToastMsg("복사 완료!");
    setTimeout(() => setToastMsg(null), 1500);
  };

  const handleGenerate = async () => {
    if (topic.trim() === "" || loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();

      if (!res.ok || !data?.feed) {
        setError(data?.error || "생성에 실패했습니다.");
        setLoading(false);
        return;
      }

      setFeed(data.feed);
    } catch (err) {
      console.error("[Home] generate flow failed", err);
      setError("잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 bg-white px-4 py-6 pb-16">
      <header className="text-center">
        <h1 className="text-xl font-black text-black">04호기 SNS 바이럴 피더</h1>
        <p className="mt-1 text-sm text-zinc-600">스레드 & 스토리 전용</p>
      </header>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="오늘의 릴스 주제 또는 키워드 입력"
          className="w-full rounded-xl border-2 border-black px-4 py-4 text-base text-black outline-none placeholder:text-zinc-400"
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || topic.trim() === ""}
          className="w-full rounded-xl bg-yellow-400 py-5 text-lg font-black text-black shadow-lg transition active:scale-95 disabled:opacity-50"
        >
          {loading ? "생성 중..." : "1초 만에 스레드·스토리 원고 뽑기"}
        </button>
        {error && <p className="text-sm font-bold text-red-600">{error}</p>}
      </div>

      {feed && (
        <div className="flex flex-col gap-4">
          <ThreadCard threadPost={feed.threadPost} onCopied={showToast} />
          <StoryGuideCard storySticker={feed.storySticker} onCopied={showToast} />
        </div>
      )}

      <Toast message={toastMsg} />
    </div>
  );
}
