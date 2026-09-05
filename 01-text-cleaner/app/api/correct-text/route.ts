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
                  text: `다음은 문자 메시지나 카톡에서 복사한 한국어 텍스트야. 아래 규칙을 반드시 지켜서 교정해줘.

1. 맞춤법과 띄어쓰기 오류만 수정한다.
2. 축약어, 은어, 뜻을 알 수 없는 표현(예: "B4F", "ㄱㅅ" 같은 것)은 절대로 풀어쓰거나 다른 말로 바꾸지 않는다. 원래 그대로 둔다.
3. 문장의 원래 의미나 어투를 절대 바꾸지 않는다. 의역하거나 문장을 재구성하지 않는다.
4. 줄바꿈 구조는 원본 그대로 유지한다.
5. "[Web발신]"처럼 통신사가 자동으로 붙이는 광고성 발신 표시 태그가 맨 앞에 있으면 그 태그만 제거한다. 그 외 본문 내용은 절대 건드리지 않는다.
6. 설명이나 추가 문구 없이 교정된 텍스트만 출력한다.

텍스트:
${text}`,
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
