import { NextRequest, NextResponse } from "next/server";
import { getGeminiApiKey, geminiEndpoint } from "@/lib/gemini";
import { ViralFeed } from "@/lib/types";

const FEED_SCHEMA = {
  type: "OBJECT",
  properties: {
    threadPost: { type: "STRING" },
    storySticker: { type: "STRING" },
  },
  required: ["threadPost", "storySticker"],
};

// Gemini가 지시를 어겨 **, _ 같은 마크다운 기호를 섞어 보내도 복사 즉시 순수 텍스트로 붙여넣을 수 있도록 방어적으로 제거한다.
function stripMarkdown(text: string): string {
  return text.replace(/\*\*/g, "").replace(/[*_`#]/g, "").trim();
}

export async function POST(request: NextRequest) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  let topic: string | undefined;
  try {
    const body = await request.json();
    topic = typeof body?.topic === "string" ? body.topic.trim() : undefined;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!topic) {
    return NextResponse.json({ error: "주제 또는 키워드를 입력해주세요." }, { status: 400 });
  }

  const prompt = `너는 건설 현장 출신의 구수하면서도 프로페셔널한 "김반장" 페르소나로 SNS 바이럴 카피를 쓰는 카피라이터다.

[오늘의 릴스 주제/키워드]
${topic}

위 주제로 아래 두 가지를 만들어줘.

1. threadPost — 스레드(Threads)용 맞춤 원고
[스레드 SEO 규칙 — 반드시 지킬 것]
- 첫 줄은 질문형이 아니라 단정형이거나 도발형인 강한 후킹 문장으로 시작한다 (예: "~하는 사람 100% 손해봅니다." 같은 단정 어조. "~해보셨나요?" 같은 질문형 절대 금지).
- 본문은 3~4문장으로 쓰고, 문장 사이사이 줄바꿈을 넉넉히 넣어(\\n\\n) 가독성 좋게 구성한다.
- 해시태그를 문장 끝에 도배하듯 나열하지 않는다. 대신 핵심 키워드를 본문 문장 안에 자연스럽게 녹여쓴다.
- 본문 안에 URL/링크를 절대 넣지 않는다.
- 마지막 문장은 "프로필 링크 확인"을 유도하는 문장이거나, 독자의 공감을 이끌어내는 문장으로 마무리한다.
- 김반장 페르소나답게 구수한 현장 말투를 살짝 섞되, 전문성이 느껴지게 쓴다.
- 마크다운 기호(**, *, _, # 등)는 절대 쓰지 않는다. 복사해서 바로 붙여넣을 순수 텍스트로만 작성한다.

2. storySticker — 인스타 스토리에서 릴스 위에 얹을 텍스트 스티커 문구
- 15자 이내로 짧고 강렬하게, 위 주제를 한눈에 요약한다.
- 마크다운 기호 없이 순수 텍스트로만 작성한다.`;

  console.log("[generate-feed] 1/2 Gemini 호출 시작");
  let raw: string;
  try {
    const response = await fetch(geminiEndpoint(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: FEED_SCHEMA,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[generate-feed] Gemini 호출 실패 — non-OK response", response.status, errBody);
      return NextResponse.json({ error: "원고 생성에 실패했습니다." }, { status: 502 });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string" || text.trim() === "") {
      console.error("[generate-feed] Gemini 응답에 후보 텍스트가 없음", JSON.stringify(data));
      return NextResponse.json({ error: "생성 결과를 받지 못했습니다." }, { status: 502 });
    }

    raw = text;
    console.log("[generate-feed] Gemini 호출 성공, 응답 수신 완료");
  } catch (err) {
    console.error("[generate-feed] Gemini 호출 중 예외 발생(네트워크/타임아웃 등)", err);
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }

  console.log("[generate-feed] 2/2 JSON 파싱 시작");
  try {
    const parsed = JSON.parse(raw) as ViralFeed;
    const feed: ViralFeed = {
      threadPost: stripMarkdown(parsed.threadPost),
      storySticker: stripMarkdown(parsed.storySticker),
    };
    console.log("[generate-feed] JSON 파싱 성공");
    return NextResponse.json({ feed });
  } catch (err) {
    console.error("[generate-feed] JSON 파싱 실패 — Gemini 응답이 유효한 JSON이 아님", raw, err);
    return NextResponse.json({ error: "결과 형식이 올바르지 않습니다." }, { status: 502 });
  }
}
