import { NextRequest, NextResponse } from "next/server";
import { getGeminiApiKey, geminiEndpoint } from "@/lib/gemini";
import { STORY_LINK_URL, ViralFeed } from "@/lib/types";

const FEED_SCHEMA = {
  type: "OBJECT",
  properties: {
    threadPost: { type: "STRING" },
    threadFirstCommentLead: { type: "STRING" },
    storySticker: { type: "STRING" },
    reelsPinnedComment: { type: "STRING" },
    reelsCaption: { type: "STRING" },
    commentDmTrigger: { type: "STRING" },
  },
  required: [
    "threadPost",
    "threadFirstCommentLead",
    "storySticker",
    "reelsPinnedComment",
    "reelsCaption",
    "commentDmTrigger",
  ],
};

interface RawFeed {
  threadPost: string;
  threadFirstCommentLead: string;
  storySticker: string;
  reelsPinnedComment: string;
  reelsCaption: string;
  commentDmTrigger: string;
}

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

  const prompt = `너는 현장에서 직접 일하며 다져진, 구수하고 신뢰감 있는 목소리로 SNS 바이럴 카피를 쓰는 카피라이터다.
말투는 현장 근무자 특유의 뚝심 있고 친근한 구어체를 쓰되, "30년", "10년차" 같은 구체적인 경력 연차 숫자는 절대 언급하지 않는다. 연차를 특정하지 않고도 신뢰감이 느껴지도록 어투와 표현으로만 승부한다.

[오늘의 릴스 주제/키워드]
${topic}

위 주제로 아래 6가지 콘텐츠를 전부 만들어줘. 모든 항목은 마크다운 기호(**, *, _, # 등) 없이 복사 즉시 붙여넣을 수 있는 순수 텍스트로만 작성한다. 모든 항목에서 URL이나 링크는 절대 직접 쓰지 않는다(링크는 시스템이 별도로 고정 삽입한다).

1. threadPost — 스레드(Threads)용 본문 원고
- 첫 줄은 질문형이 아니라 단정형이거나 도발형인 강한 후킹 문장으로 시작한다 ("~해보셨나요?" 같은 질문형 절대 금지).
- 본문은 3~4문장으로 쓰고, 문장 사이사이 줄바꿈을 넉넉히 넣어(\\n\\n) 가독성 좋게 구성한다.
- 해시태그를 문장 끝에 도배하듯 나열하지 않는다. 대신 핵심 키워드를 본문 문장 안에 자연스럽게 녹여쓴다.
- 본문 안에 URL/링크를 절대 넣지 않는다.
- 마지막 문장은 독자가 댓글을 달고 싶어지는 대화 유도형 질문으로 끝난다 (반드시 물음표로 마무리).

2. threadFirstCommentLead — 본문 게시 직후 첫 댓글로 달 매직링크 안내 문구의 "리드 문장"
- 짧고 임팩트 있게, "이 아래 댓글에 무료 이용권 링크가 있다"는 느낌을 준다.
- 문장 맨 끝은 반드시 화살표 이모지 "👉" 하나로 끝낸다 (뒤에 시스템이 URL을 붙인다). 예: "7일 무료 프리패스는 요기서 바로 뚫립니더 👉"
- URL은 절대 직접 쓰지 않는다.

3. storySticker — 인스타 스토리에서 릴스 위에 얹을 텍스트 스티커 문구
- 15자 이내로 짧고 강렬하게, 위 주제를 한눈에 요약한다.

4. reelsPinnedComment — 릴스 업로드 후 댓글창 최상단에 고정할 안내 문구
- 정확히 2줄(줄바꿈 1번)로 작성한다.
- "프로필 링크"를 확인하라는 안내를 자연스럽게 포함한다 (URL 자체는 쓰지 않는다).

5. reelsCaption — 릴스 캡션 (인스타 SEO 최적화)
- 전체 길이는 자유롭게 쓰되, 처음 125자 안에 이번 주제와 관련된 핵심 검색 키워드 2~3개를 자연스럽게 집중 배치한다 (인스타가 피드에서 앞부분만 미리보여주는 구간이기 때문).
- 문장 안 어딘가에 "저장해두고 필요할 때 꺼내 쓰세요" 같은 저장(Save) 행동을 유도하는 문구를 반드시 포함한다.

6. commentDmTrigger — 댓글/DM 참여 유도 트리거 문구
- "댓글에 [키워드]라고 남겨주시면 무료 링크를 다이렉트로 보내드립니다" 형태로 작성하되, [키워드] 자리에는 이번 주제와 어울리는 2~4자 짧은 단어를 직접 골라서 넣는다 (예시 그대로 "대본"을 쓰지 말고 주제에 맞게 새로 고른다).
- URL은 절대 직접 쓰지 않는다.`;

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
    const parsed = JSON.parse(raw) as RawFeed;
    const lead = stripMarkdown(parsed.threadFirstCommentLead);
    const feed: ViralFeed = {
      threadPost: stripMarkdown(parsed.threadPost),
      threadFirstComment: `${lead} ${STORY_LINK_URL}`,
      storySticker: stripMarkdown(parsed.storySticker),
      reelsPinnedComment: stripMarkdown(parsed.reelsPinnedComment),
      reelsCaption: stripMarkdown(parsed.reelsCaption),
      commentDmTrigger: stripMarkdown(parsed.commentDmTrigger),
    };
    console.log("[generate-feed] JSON 파싱 성공");
    return NextResponse.json({ feed });
  } catch (err) {
    console.error("[generate-feed] JSON 파싱 실패 — Gemini 응답이 유효한 JSON이 아님", raw, err);
    return NextResponse.json({ error: "결과 형식이 올바르지 않습니다." }, { status: 502 });
  }
}
