"use client";

import { useEffect, useMemo, useState } from "react";
import PremiumCapsule from "@/components/PremiumCapsule";
import { DiffToken, diffWords, hasLongDigitRun } from "@/lib/diff";
import { CleanStats, cleanTextWithStats } from "@/lib/textClean";
import { consumeFreeUse, getRemainingFreeUses } from "@/lib/usage";

function buildCleanSummary(stats: CleanStats): string {
  const { charsBefore, charsAfter, charsReduced, spacesRemoved, lineBreaksRemoved } = stats;
  const changeLabel =
    charsReduced > 0 ? `${charsReduced}자 감소` : charsReduced < 0 ? `${Math.abs(charsReduced)}자 증가` : "변화 없음";

  return `${charsBefore}자 → ${charsAfter}자 (${changeLabel}, 공백 ${spacesRemoved}개·줄바꿈 ${lineBreaksRemoved}개 정리됨)`;
}

export default function Home() {
  const [text, setText] = useState("");
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [correctionDiff, setCorrectionDiff] = useState<DiffToken[] | null>(null);
  const [showNumberWarning, setShowNumberWarning] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [lineBreaksOn, setLineBreaksOn] = useState(true);
  const [spacingOn, setSpacingOn] = useState(true);
  const [cleanStats, setCleanStats] = useState<CleanStats | null>(null);

  useEffect(() => {
    setRemaining(getRemainingFreeUses());
  }, []);

  const charsWithSpace = text.length;
  const charsNoSpace = useMemo(() => text.replace(/\s/g, "").length, [text]);
  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
  }, [text]);

  const handleClean = () => {
    if (text.trim() === "") return;

    const originalText = text;
    const { result: cleaned, stats } = cleanTextWithStats(text, {
      lineBreaks: lineBreaksOn,
      spacing: spacingOn,
    });

    setText(cleaned);
    setCorrectionDiff(diffWords(originalText, cleaned));
    setCleanStats(stats);
    setShowNumberWarning(false);
  };

  const handleCopy = async () => {
    if (text.trim() === "") {
      alert("복사할 내용이 없습니다");
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      alert("복사에 실패했습니다. 텍스트를 직접 선택해서 복사해주세요");
    }
  };

  const handlePremiumClick = async () => {
    if (isCorrecting) return;

    const currentRemaining = getRemainingFreeUses();
    if (currentRemaining <= 0) {
      alert("결제 준비 중입니다");
      return;
    }

    if (text.trim() === "") {
      alert("교정할 텍스트를 먼저 입력해주세요");
      return;
    }

    const originalText = text;
    setIsCorrecting(true);
    try {
      const response = await fetch("/api/correct-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: originalText }),
      });
      const data = await response.json();

      if (!response.ok || typeof data.corrected !== "string") {
        throw new Error(data?.error || "교정 실패");
      }

      setText(data.corrected);
      setCorrectionDiff(diffWords(originalText, data.corrected));
      setCleanStats(null);
      setShowNumberWarning(hasLongDigitRun(data.corrected));
      setRemaining(consumeFreeUse());
    } catch {
      alert("잠시 후 다시 시도해주세요");
    } finally {
      setIsCorrecting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center bg-white px-4 py-10 sm:px-8">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <h1 className="text-center text-4xl font-extrabold text-black sm:text-5xl">
          텍스트 정리기
        </h1>
        <p className="text-center text-xl text-zinc-600 sm:text-2xl">
          카톡·메모에서 복사한 지저분한 텍스트, 1초 만에 깔끔하게
        </p>

        {showNumberWarning && correctionDiff && (
          <p className="text-center text-base font-bold text-amber-600">
            ⚠️ 숫자는 AI가 놓칠 수 있어요. 다시 한 번 확인해주세요.
          </p>
        )}

        {correctionDiff && cleanStats && (
          <p className="rounded-xl bg-black px-4 py-3 text-center text-xl font-extrabold text-yellow-400 sm:text-2xl">
            {buildCleanSummary(cleanStats)}
          </p>
        )}

        {correctionDiff ? (
          <div
            onClick={() => setCorrectionDiff(null)}
            className="h-64 w-full cursor-text overflow-auto whitespace-pre-wrap rounded-2xl border-4 border-black p-5 text-2xl leading-relaxed text-black sm:h-80"
          >
            {correctionDiff.map((token, index) =>
              token.changed ? (
                <mark key={index} className="bg-yellow-200">
                  {token.text}
                </mark>
              ) : (
                <span key={index}>{token.text}</span>
              )
            )}
          </div>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="카톡에서 복사한 글을 여기에 붙여넣어 보세요"
            className="h-64 w-full rounded-2xl border-4 border-black p-5 text-2xl leading-relaxed text-black focus:outline-none focus:ring-4 focus:ring-yellow-400 sm:h-80"
          />
        )}

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl border-2 border-black bg-zinc-50 p-4">
            <div className="text-xl font-medium text-zinc-700">글자수(공백포함)</div>
            <div className="text-3xl font-bold text-black">{charsWithSpace}</div>
          </div>
          <div className="rounded-xl border-2 border-black bg-zinc-50 p-4">
            <div className="text-xl font-medium text-zinc-700">글자수(공백제외)</div>
            <div className="text-3xl font-bold text-black">{charsNoSpace}</div>
          </div>
          <div className="rounded-xl border-2 border-black bg-zinc-50 p-4">
            <div className="text-xl font-medium text-zinc-700">단어 수</div>
            <div className="text-3xl font-bold text-black">{wordCount}</div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xl font-semibold text-zinc-700">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={lineBreaksOn}
              onChange={(e) => setLineBreaksOn(e.target.checked)}
              className="h-6 w-6 accent-black"
            />
            줄바꿈 정리
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={spacingOn}
              onChange={(e) => setSpacingOn(e.target.checked)}
              className="h-6 w-6 accent-black"
            />
            띄어쓰기 교정
          </label>
        </div>

        <button
          onClick={handleClean}
          className="w-full rounded-2xl bg-black py-5 text-2xl font-extrabold text-yellow-400 shadow-lg transition active:scale-95 sm:text-3xl"
        >
          불필요한 공백/줄바꿈 1초 정리
        </button>

        <p className="text-center text-lg text-zinc-500">
          블로그 원고, 문자 메시지, 보고서 정리에 사용하세요
        </p>

        <button
          onClick={handleCopy}
          disabled={text.trim() === ""}
          className="w-full rounded-xl bg-black py-3 text-lg font-bold text-yellow-400 shadow transition active:scale-95 disabled:opacity-40"
        >
          {copied ? "복사됨! ✓" : "정리된 글 복사하기"}
        </button>

        <p className="text-center text-base font-semibold text-zinc-500">
          오늘 남은 무료 횟수: {remaining === null ? "-" : `${remaining}회`}
        </p>
        <PremiumCapsule
          description="프리미엄 확장팩 (AI 맞춤법 교정 평생 사용)"
          price="3,900원"
          onClick={handlePremiumClick}
          disabled={isCorrecting}
          isLoading={isCorrecting}
          loadingText="교정 중..."
        />
      </div>
    </div>
  );
}
