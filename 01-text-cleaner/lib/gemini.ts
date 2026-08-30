export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || undefined;
}
