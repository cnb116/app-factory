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

export function geminiEndpoint(apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
}
