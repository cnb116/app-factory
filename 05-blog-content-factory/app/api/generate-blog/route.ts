import { NextRequest, NextResponse } from "next/server";
import { getGeminiApiKey, geminiEndpoint } from "@/lib/gemini";
import { BlogFeed, MAGIC_LINK_URL, PARTNER_LINK_PLACEHOLDER, PARTNER_LINK_PREFIX } from "@/lib/types";

const FEED_SCHEMA = {
  type: "OBJECT",
  properties: {
    naverTitle: { type: "STRING" },
    naverBody: { type: "STRING" },
    naverMetaDescription: { type: "STRING" },
    keywords: { type: "ARRAY", items: { type: "STRING" } },
    wordpressSeoTitle: { type: "STRING" },
    wordpressMetaDescription: { type: "STRING" },
    wordpressBody: { type: "STRING" },
  },
  required: [
    "naverTitle",
    "naverBody",
    "naverMetaDescription",
    "keywords",
    "wordpressSeoTitle",
    "wordpressMetaDescription",
    "wordpressBody",
  ],
};

interface RawBlog {
  naverTitle: string;
  naverBody: string;
  naverMetaDescription: string;
  keywords: string[];
  wordpressSeoTitle: string;
  wordpressMetaDescription: string;
  wordpressBody: string;
}

function stripMarkdown(text: string): string {
  return text.replace(/\*\*/g, "").replace(/[*_`#]/g, "").trim();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const GEMINI_MAX_RETRIES = 2;
const GEMINI_RETRY_DELAY_MS = 1200;

// 네이버 본문(일반 텍스트, 문단은 \n\n으로 구분)의 딱 중간 문단 뒤에 이미지 삽입 마커를 끼워 넣는다.
function insertMidwayMarker(text: string, marker: string): string {
  const paragraphs = text.split("\n\n").filter((p) => p.trim() !== "");
  if (paragraphs.length >= 2) {
    const mid = Math.ceil(paragraphs.length / 2);
    paragraphs.splice(mid, 0, marker);
    return paragraphs.join("\n\n");
  }
  return `${text}\n\n${marker}`;
}

// 워드프레스 본문(HTML, <p> 단락 기준)의 중간에 이미지 태그를 끼워 넣는다.
function insertMidwayHtml(html: string, injectHtml: string): string {
  const parts = html.split("</p>").filter((p) => p.trim() !== "");
  if (parts.length >= 2) {
    const mid = Math.ceil(parts.length / 2);
    const rebuilt = parts.map((p) => `${p}</p>`);
    rebuilt.splice(mid, 0, injectHtml);
    return rebuilt.join("");
  }
  return `${html}${injectHtml}`;
}

export async function POST(request: NextRequest) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  let topic: string | undefined;
  let partnerUrl: string | undefined;
  try {
    const body = await request.json();
    topic = typeof body?.topic === "string" ? body.topic.trim() : undefined;
    partnerUrl = typeof body?.partnerUrl === "string" ? body.partnerUrl.trim() : undefined;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!topic) {
    return NextResponse.json({ error: "주제 또는 키워드를 입력해주세요." }, { status: 400 });
  }

  const prompt = `너는 현장에서 직접 일하며 다져진, 구수하고 신뢰감 있는 목소리로 블로그 콘텐츠를 쓰는 카피라이터다.
말투는 현장 근무자 특유의 뚝심 있고 친근한 구어체를 쓰되, "30년", "10년차" 같은 구체적인 경력 연차 숫자는 절대 언급하지 않는다. 연차를 특정하지 않고도 신뢰감이 느껴지도록 어투와 표현으로만 승부한다.
모든 출력은 순수 한국어로만 작성한다 — 일본어·중국어·영어 단어를 절대 섞지 않는다.

[진정성 배경 — 자연스러운 빈도로만 활용]
이 도구는 실제로 1년차 건설 현장 근무자가 퇴근 후 밤마다 AI 자동화를 독학하며 직접 만든 것이다. 이 배경을 광고 문구처럼 반복하지 않는다 — 네이버 본문 또는 워드프레스 본문 둘 중 한 곳에서만 자연스럽게 스치듯 녹인다.

[오늘의 주제/키워드]
${topic}

위 주제로 아래 7가지를 전부 만들어줘. naverBody와 wordpressBody 둘 다 본문 끝에 절대 링크나 "자세히 보기" 같은 유도 문장을 쓰지 않는다 — 본문 내용만 자연스럽게 마무리하고 멈춘다(마무리 CTA·이미지·링크는 전부 시스템이 자동으로 이어붙인다).

1. naverTitle — 네이버 블로그 SEO 최적화 제목 (제목 텍스트만, 대괄호나 "네이버 블로그 제목:" 같은 접두어는 붙이지 않는다 — 시스템이 별도로 감싼다)

2. naverBody — 네이버 블로그 본문 (850자 이내, 시스템이 이미지 마커·링크를 추가로 붙이므로 본문 자체는 600자 안쪽으로 여유를 둔다)
- 구수한 사투리 입담이 살아있는 일기 형식으로, 오늘 하루 있었던 일처럼 자연스럽게 풀어간다.
- 마크다운 기호 없이 순수 텍스트로만 작성, 문단은 빈 줄(\\n\\n)로 구분한다.
- 아래 5. keywords에 담을 핵심 키워드 3~5개를 본문 문장 안에 자연스럽게 녹여쓴다(과도하게 반복하지 않는다, 각 키워드 1~2회면 충분).

3. naverMetaDescription — 네이버 SEO 메타 설명 (1~2문장, 검색 결과에 노출될 요약문)

4. wordpressSeoTitle — 워드프레스 SEO 타이틀 태그 (60자 이내, 핵심 키워드를 앞쪽에 배치)

5. keywords — 이번 주제의 핵심 SEO 키워드 3~5개 (naverBody에 실제로 녹인 키워드와 동일하게, 문자열 배열로)

6. wordpressMetaDescription — 워드프레스 메타 디스크립션 (155자 이내, 검색 결과 노출용 요약)

7. wordpressBody — 워드프레스 본문 (1500자 이내, 시스템이 이미지 태그·링크를 추가로 붙이므로 본문 자체는 1100자 안쪽으로 여유를 둔다)
- 네이버와 달리 전문 용어를 쓰는 정보성 콘텐츠 톤으로 작성한다.
- 마크다운 기호는 절대 쓰지 않고, <h2>, <h3>, <p> HTML 태그만 사용해 구조를 잡는다.`;

  console.log("[generate-blog] 1/2 Gemini 호출 시작");
  let raw: string;
  try {
    let response: Response;
    let attempt = 0;

    while (true) {
      response = await fetch(geminiEndpoint(apiKey), {
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

      if (response.ok || response.status !== 503 || attempt >= GEMINI_MAX_RETRIES) {
        break;
      }

      console.warn(
        `[generate-blog] Gemini 503(일시 과부하) — ${GEMINI_RETRY_DELAY_MS}ms 후 재시도 (${attempt + 1}/${GEMINI_MAX_RETRIES})`
      );
      await sleep(GEMINI_RETRY_DELAY_MS);
      attempt += 1;
    }

    if (!response.ok) {
      const errBody = await response.text();
      console.error(
        `[generate-blog] Gemini 호출 실패 — non-OK response (총 ${attempt + 1}회 시도)`,
        response.status,
        errBody
      );
      return NextResponse.json({ error: "포스팅 생성에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 502 });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string" || text.trim() === "") {
      console.error("[generate-blog] Gemini 응답에 후보 텍스트가 없음", JSON.stringify(data));
      return NextResponse.json({ error: "생성 결과를 받지 못했습니다." }, { status: 502 });
    }

    raw = text;
    console.log(`[generate-blog] Gemini 호출 성공, 응답 수신 완료 (총 ${attempt + 1}회 시도)`);
  } catch (err) {
    console.error("[generate-blog] Gemini 호출 중 예외 발생(네트워크/타임아웃 등)", err);
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }

  console.log("[generate-blog] 2/2 JSON 파싱 시작");
  try {
    const parsed = JSON.parse(raw) as RawBlog;
    const keywords = Array.isArray(parsed.keywords) ? parsed.keywords.map((k) => stripMarkdown(k)).filter(Boolean) : [];
    const naverTitle = stripMarkdown(parsed.naverTitle);
    const naverBody = stripMarkdown(parsed.naverBody);
    const wordpressBody = parsed.wordpressBody.trim();
    const altText = keywords.slice(0, 3).join(" ") || topic;

    const partnerLineNaver = partnerUrl ? `${PARTNER_LINK_PREFIX} ${partnerUrl}` : PARTNER_LINK_PLACEHOLDER;
    const partnerLineWp = partnerUrl
      ? `<p>${PARTNER_LINK_PREFIX} <a href="${partnerUrl}">${partnerUrl}</a></p>`
      : `<p>${PARTNER_LINK_PLACEHOLDER}</p>`;

    const naverBodyWithImage = insertMidwayMarker(naverBody, "[본문 중간 이미지 삽입 위치]");

    const naverPost = [
      `[네이버 블로그 제목: ${naverTitle}]`,
      "",
      "[썸네일 이미지 삽입 위치]",
      "",
      naverBodyWithImage,
      "",
      `SEO 키워드: ${keywords.join(", ")}`,
      "",
      partnerLineNaver,
      `7일 무료 이용권은 여기서 바로 받아가세요: ${MAGIC_LINK_URL}`,
    ].join("\n");

    const thumbnailImg = `<img src="[이미지 URL을 여기에 붙여넣으세요]" alt="${altText}">`;
    const midImg = `<img src="[이미지 URL을 여기에 붙여넣으세요]" alt="${altText}">`;
    const wordpressBodyWithImage = insertMidwayHtml(wordpressBody, midImg);

    const wordpressPost = [
      thumbnailImg,
      wordpressBodyWithImage,
      partnerLineWp,
      `<p>네이버 블로그에는 더 생생한 현장 이야기로 풀어뒀습니다. 7일 무료 이용권은 아래 링크에서 바로 받아보세요.</p>`,
      `<p><a href="${MAGIC_LINK_URL}">${MAGIC_LINK_URL}</a></p>`,
    ].join("\n");

    const blog: BlogFeed = {
      naverPost,
      naverMetaDescription: stripMarkdown(parsed.naverMetaDescription),
      keywords,
      wordpressPost,
      wordpressSeoTitle: stripMarkdown(parsed.wordpressSeoTitle),
      wordpressMetaDescription: stripMarkdown(parsed.wordpressMetaDescription),
    };

    console.log("[generate-blog] JSON 파싱 성공");
    return NextResponse.json({ blog });
  } catch (err) {
    console.error("[generate-blog] JSON 파싱 실패 — Gemini 응답이 유효한 JSON이 아님", raw, err);
    return NextResponse.json({ error: "결과 형식이 올바르지 않습니다." }, { status: 502 });
  }
}
