import { NextRequest, NextResponse } from "next/server";
import { getGeminiApiKey } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  let text: unknown;
  try {
    const body = await request.json();
    text = body?.text;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (typeof text !== "string" || text.trim() === "") {
    return NextResponse.json({ error: "교정할 텍스트가 없습니다." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `다음 한국어 텍스트의 맞춤법과 띄어쓰기, 어색한 표현만 자연스럽게 교정해줘. 줄바꿈 구조와 원래 의미는 최대한 그대로 유지하고, 설명이나 추가 문구 없이 교정된 텍스트만 출력해:\n\n${text}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "교정 요청에 실패했습니다." }, { status: 502 });
    }

    const data = await response.json();
    const corrected = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof corrected !== "string" || corrected.trim() === "") {
      return NextResponse.json({ error: "교정 결과를 받지 못했습니다." }, { status: 502 });
    }

    return NextResponse.json({ corrected: corrected.trim() });
  } catch {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
