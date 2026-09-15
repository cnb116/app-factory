"use client";

import { useState } from "react";
import { ContentAnalysis, ScriptCard } from "@/lib/types";
import UrlInputStep from "@/components/UrlInputStep";
import SwipeStep from "@/components/SwipeStep";
import PackageStep from "@/components/PackageStep";
import CallFloatingButton from "@/components/CallFloatingButton";

type Phase = "input" | "swipe" | "package";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("input");
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [cards, setCards] = useState<ScriptCard[]>([]);
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [accepted, setAccepted] = useState<ScriptCard[]>([]);

  const handleAnalyze = async (url: string) => {
    setError(null);
    setLoading(true);
    setLoadingLabel("페이지를 분석하는 중...");

    try {
      const analyzeRes = await fetch("/api/analyze-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const analyzeData = await analyzeRes.json();

      if (!analyzeRes.ok) {
        setError(analyzeData?.error || "분석에 실패했습니다.");
        setLoading(false);
        return;
      }

      setAnalysis(analyzeData.analysis);
      setLoadingLabel("바이럴 대본 10편을 만드는 중...");

      const scriptsRes = await fetch("/api/generate-scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: analyzeData.analysis }),
      });
      const scriptsData = await scriptsRes.json();

      if (!scriptsRes.ok || !Array.isArray(scriptsData?.cards) || scriptsData.cards.length === 0) {
        setError(scriptsData?.error || "대본 생성에 실패했습니다.");
        setLoading(false);
        return;
      }

      setCards(scriptsData.cards);
      setSwipeIndex(0);
      setAccepted([]);
      setPhase("swipe");
    } catch (err) {
      console.error("[Home] analyze flow failed", err);
      setError("잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = (isAccepted: boolean) => {
    const current = cards[swipeIndex];
    const nextAccepted = isAccepted ? [...accepted, current] : accepted;
    if (isAccepted) setAccepted(nextAccepted);

    const nextIndex = swipeIndex + 1;
    if (nextIndex >= cards.length) {
      setPhase("package");
    } else {
      setSwipeIndex(nextIndex);
    }
  };

  const handleRestart = () => {
    setPhase("input");
    setAnalysis(null);
    setCards([]);
    setSwipeIndex(0);
    setAccepted([]);
    setError(null);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      {phase === "input" && (
        <UrlInputStep onSubmit={handleAnalyze} loading={loading} loadingLabel={loadingLabel} error={error} />
      )}

      {phase === "swipe" && cards[swipeIndex] && (
        <SwipeStep card={cards[swipeIndex]} index={swipeIndex} total={cards.length} onDecision={handleDecision} />
      )}

      {phase === "package" && <PackageStep cards={accepted} onRestart={handleRestart} />}

      <CallFloatingButton />
    </div>
  );
}
