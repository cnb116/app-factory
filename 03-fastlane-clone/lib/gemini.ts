export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || undefined;
}

export const GEMINI_MODEL = "gemini-3.6-flash";

export function geminiEndpoint(apiKey: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
}
