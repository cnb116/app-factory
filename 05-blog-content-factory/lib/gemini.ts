export function getGeminiApiKey(): string | undefined {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === "") {
    console.error(
      "[gemini] GEMINI_API_KEY가 비어있습니다. .env.local에 키가 있는지 확인하고 서버를 재시작(Ctrl+C 후 npm run dev)하세요."
    );
    return undefined;
  }
  return key;
}

export const GEMINI_MODEL = "gemini-3.5-flash-lite";
// 이미지 생성 전용 모델 — 텍스트 모델과 별개로 Gemini API가 제공하는 이미지 생성 엔드포인트.
export const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image";

export function geminiEndpoint(apiKey: string, model: string = GEMINI_MODEL): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
}
