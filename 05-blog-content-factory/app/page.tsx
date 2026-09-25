"use client";

import { useState } from "react";
import { BlogFeed } from "@/lib/types";
import VoiceRecorder from "@/components/VoiceRecorder";
import ImagePicker from "@/components/ImagePicker";
import NaverBlogCard from "@/components/NaverBlogCard";
import WordpressBlogCard from "@/components/WordpressBlogCard";
import Toast from "@/components/Toast";

type InputMode = "text" | "voice";

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [topic, setTopic] = useState("");
  const [partnerUrl, setPartnerUrl] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blog, setBlog] = useState<BlogFeed | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleTranscribed = (text: string) => {
    setTopic(text);
    setInputMode("text");
  };

  const showToast = () => {
    setToastMsg("복사 완료!");
    setTimeout(() => setToastMsg(null), 1500);
  };

  const handleGenerate = async () => {
    if (topic.trim() === "" || loading) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, partnerUrl: partnerUrl.trim() || undefined }),
      });
      const data = await res.json();

      if (!res.ok || !data?.blog) {
        setError(data?.error || "생성에 실패했습니다.");
        setLoading(false);
        return;
      }

      setBlog(data.blog);
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
        <h1 className="text-xl font-black text-black">05호기 블로그 콘텐츠 팩토리</h1>
        <p className="mt-1 text-sm text-zinc-600">이미지+SEO 완결형 블로그 생성기</p>
      </header>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setInputMode("text")}
            className={`flex-1 rounded-xl border-2 border-black py-3 text-base font-bold transition ${
              inputMode === "text" ? "bg-black text-yellow-400" : "bg-white text-black"
            }`}
          >
            ⌨️ 텍스트
          </button>
          <button
            type="button"
            onClick={() => setInputMode("voice")}
            className={`flex-1 rounded-xl border-2 border-black py-3 text-base font-bold transition ${
              inputMode === "voice" ? "bg-black text-yellow-400" : "bg-white text-black"
            }`}
          >
            🎙️ 음성
          </button>
        </div>

        {inputMode === "text" ? (
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="오늘의 블로그 주제 또는 키워드 입력"
            className="w-full rounded-xl border-2 border-black px-4 py-4 text-base text-black outline-none placeholder:text-zinc-400"
          />
        ) : (
          <VoiceRecorder onTranscribed={handleTranscribed} />
        )}

        <input
          type="text"
          value={partnerUrl}
          onChange={(e) => setPartnerUrl(e.target.value)}
          placeholder="연결할 상대 글 URL (선택, 비워둬도 됨)"
          className="w-full rounded-xl border-2 border-zinc-300 px-4 py-3 text-sm text-black outline-none placeholder:text-zinc-400"
        />

        <ImagePicker topic={topic} imageDataUrl={imageDataUrl} onImageChange={setImageDataUrl} />

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || topic.trim() === ""}
          className="w-full rounded-xl bg-yellow-400 py-5 text-lg font-black text-black shadow-lg transition active:scale-95 disabled:opacity-50"
        >
          {loading ? "생성 중..." : "1초 만에 완결형 블로그 포스팅 뽑기"}
        </button>
        {error && <p className="text-sm font-bold text-red-600">{error}</p>}
      </div>

      {blog && (
        <div className="flex flex-col gap-4">
          <NaverBlogCard
            naverPost={blog.naverPost}
            naverMetaDescription={blog.naverMetaDescription}
            keywords={blog.keywords}
            onCopied={showToast}
          />
          <WordpressBlogCard
            wordpressPost={blog.wordpressPost}
            wordpressSeoTitle={blog.wordpressSeoTitle}
            wordpressMetaDescription={blog.wordpressMetaDescription}
            onCopied={showToast}
          />
        </div>
      )}

      <Toast message={toastMsg} />
    </div>
  );
}
