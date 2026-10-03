import { ScriptCard } from "./types";
import { BRIGHT_EMOTIONS, BROAD_HOOK_TYPE } from "./slotPlan";

type LabelInput = Pick<ScriptCard, "emotionTone" | "hookType" | "emotion">;

// 밝은 감정 카드 판별. emotionTone이 빠졌거나 잘못 와도, "넓은 감정형 + 밝은 감정 이름"이면 밝은 카드로 본다(우회 판별).
export function isBrightEmotionCard(card: LabelInput): boolean {
  if (card.emotionTone === "bright") return true;
  if ((card.hookType ?? "").trim() !== BROAD_HOOK_TYPE) return false;
  const emotion = card.emotion ?? "";
  return BRIGHT_EMOTIONS.some((e) => emotion.includes(e.name));
}

// 2구간 데이터 필드명은 painAgitation으로 유지하되, 밝은 감정 카드는 화면·복사 텍스트에서 "기대 키우기"로 표시한다.
export function getSecondSectionLabel(card: LabelInput): string {
  return isBrightEmotionCard(card) ? "기대 키우기" : "고통 자극";
}

export function getSecondSectionEmoji(card: LabelInput): string {
  return isBrightEmotionCard(card) ? "✨" : "😣";
}
