"use client";

import { useMemo, useState } from "react";
import PremiumCapsule from "@/components/PremiumCapsule";
import { DiffToken, diffWords, hasLongDigitRun } from "@/lib/diff";

export default function Home() {
  const [text, setText] = useState("");
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [correctionDiff, setCorrectionDiff] = useState<DiffToken[] | null>(null);
  const [showNumberWarning, setShowNumberWarning] = useState(false);

  const charsWithSpace = text.length;
  const charsNoSpace = useMemo(() => text.replace(/\s/g, "").length, [text]);
  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
  }, [text]);

  const handleClean = () => {
    const paragraphs = text
      .replace(/\r\n/g, "\n")
      .split(/\n\s*\n/)
      .map((paragraph) => {
        const lines = paragraph
          .split("\n")
          .map((line) => line.replace(/[ \t]+/g, " ").trim())
          .filter((line) => line.length > 0);

        // 계좌번호·전화번호처럼 숫자-하이픈 조합이 있는 줄은 독립된 줄로 보존하고,
        // 그 앞뒤의 일반 문장 줄들만 한 줄로 합친다.
        const outputLines: string[] = [];
        let buffer: string[] = [];
        const flushBuffer = () => {
          if (buffer.length > 0) {
            outputLines.push(buffer.join(" "));
            buffer = [];
          }
        };

        for (const line of lines) {
          if (/\d{2,}-\d/.test(line)) {
            flushBuffer();
            outputLines.push(line);
          } else {
            buffer.push(line);
          }
        }
        flushBuffer();

        return outputLines.join("\n");
      })
      .filter((paragraph) => paragraph.length > 0);

    setText(paragraphs.join("\n\n"));
    setCorrectionDiff(null);
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
      setShowNumberWarning(hasLongDigitRun(data.corrected));
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
