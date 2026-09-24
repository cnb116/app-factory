import { NextRequest, NextResponse } from "next/server";
import { getGeminiApiKey, geminiEndpoint } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  let audioBase64: string | undefined;
  let mimeType: string | undefined;
  try {
    const body = await request.json();
    audioBase64 = typeof body?.audioBase64 === "string" ? body.audioBase64 : undefined;
    mimeType = typeof body?.mimeType === "string" ? body.mimeType : undefined;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!audioBase64 || !mimeType) {
    return NextResponse.json({ error: "녹음 데이터가 없습니다." }, { status: 400 });
  }

  console.log("[transcribe] Gemini 음성 전사 호출 시작", mimeType);
  try {
    const response = await fetch(geminiEndpoint(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "다음 음성을 한국어 텍스트로 정확하게 전사해줘. 전사된 문장 외에 다른 설명이나 인사말은 절대 붙이지 말고, 전사 결과만 출력해." },
              { inlineData: { mimeType, data: audioBase64 } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[transcribe] Gemini 호출 실패 — non-OK response", response.status, errBody);
      return NextResponse.json({ error: "음성 전사에 실패했습니다." }, { status: 502 });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string" || text.trim() === "") {
      console.error("[transcribe] Gemini 응답에 전사 텍스트가 없음", JSON.stringify(data));
      return NextResponse.json({ error: "음성을 인식하지 못했습니다. 다시 녹음해주세요." }, { status: 502 });
    }

    console.log("[transcribe] Gemini 전사 성공");
    return NextResponse.json({ text: text.trim() });
  } catch (err) {
    console.error("[transcribe] Gemini 호출 중 예외 발생(네트워크/타임아웃 등)", err);
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
