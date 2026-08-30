"use client";

import { useMemo, useState } from "react";

export default function Home() {
  const [text, setText] = useState("");

  const charsWithSpace = text.length;
  const charsNoSpace = useMemo(() => text.replace(/\s/g, "").length, [text]);
  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
  }, [text]);

  const handleClean = () => {
    const cleaned = text
      .split("\n")
      .map((line) => line.replace(/[ \t]+/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    setText(cleaned);
  };

  const handlePremiumClick = () => {
    alert("결제 준비 중입니다");
  };

  return (
    <div className="flex flex-1 flex-col items-center bg-white px-4 py-10 sm:px-8">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <h1 className="text-center text-4xl font-extrabold text-black sm:text-5xl">
          텍스트 정리기
        </h1>
        <p className="text-center text-lg text-zinc-600 sm:text-xl">
          카톡·메모에서 복사한 지저분한 텍스트, 1초 만에 깔끔하게
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="카톡에서 복사한 글을 여기에 붙여넣어 보세요"
          className="h-64 w-full rounded-2xl border-4 border-black p-5 text-2xl leading-relaxed text-black focus:outline-none focus:ring-4 focus:ring-yellow-400 sm:h-80"
        />

        <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
          <div className="rounded-xl border-2 border-black bg-zinc-50 p-4">
            <div className="text-lg font-medium text-zinc-700">글자수(공백포함)</div>
            <div className="text-3xl font-bold text-black">{charsWithSpace}</div>
          </div>
          <div className="rounded-xl border-2 border-black bg-zinc-50 p-4">
            <div className="text-lg font-medium text-zinc-700">글자수(공백제외)</div>
            <div className="text-3xl font-bold text-black">{charsNoSpace}</div>
          </div>
          <div className="rounded-xl border-2 border-black bg-zinc-50 p-4">
            <div className="text-lg font-medium text-zinc-700">단어 수</div>
            <div className="text-3xl font-bold text-black">{wordCount}</div>
          </div>
        </div>

        <button
          onClick={handleClean}
          className="w-full rounded-2xl bg-black py-8 text-3xl font-extrabold text-yellow-400 shadow-lg transition active:scale-95 sm:text-4xl"
        >
          불필요한 공백/줄바꿈 1초 정리
        </button>

        <p className="text-center text-base text-zinc-500">
          블로그 원고, 문자 메시지, 보고서 정리에 사용하세요
        </p>

        <button
          onClick={handlePremiumClick}
          className="w-full rounded-2xl bg-yellow-400 py-8 text-2xl font-extrabold text-black shadow-lg transition active:scale-95 sm:text-3xl"
        >
          프리미엄 AI 맞춤법 교정기 열기 - 3,900원
        </button>
      </div>
    </div>
  );
}
