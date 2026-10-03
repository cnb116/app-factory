import { ScriptCard } from "./types";

// 2구간 데이터 필드명은 painAgitation으로 유지하되, 밝은 감정 카드는 화면·복사 텍스트에서 "기대 키우기"로 표시한다.
export function getSecondSectionLabel(card: Pick<ScriptCard, "emotionTone">): string {
  return card.emotionTone === "bright" ? "기대 키우기" : "고통 자극";
}

export function getSecondSectionEmoji(card: Pick<ScriptCard, "emotionTone">): string {
  return card.emotionTone === "bright" ? "✨" : "😣";
}
