import { NextRequest, NextResponse } from "next/server";
import { getGeminiApiKey, geminiEndpoint } from "@/lib/gemini";
import { extractTextFromHtml, validateCrawlUrl } from "@/lib/extractText";
import { ContentAnalysis } from "@/lib/types";

const ANALYSIS_SCHEMA = {
  type: "OBJECT",
  properties: {
    targetAudience: { type: "STRING" },
    painPoints: { type: "ARRAY", items: { type: "STRING" } },
    coreOffer: { type: "STRING" },
    summary: { type: "STRING" },
  },
  required: ["targetAudience", "painPoints", "coreOffer", "summary"],
};

export async function POST(request: NextRequest) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  let url: unknown;
  try {
    const body = await request.json();
    url = body?.url;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (typeof url !== "string" || url.trim() === "") {
    return NextResponse.json({ error: "분석할 URL이 없습니다." }, { status: 400 });
  }

  const validUrl = validateCrawlUrl(url.trim());
  if (!validUrl) {
    return NextResponse.json({ error: "올바른 URL 형식이 아닙니다." }, { status: 400 });
  }

  let pageText: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const pageResponse = await fetch(validUrl.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FastlaneCloneBot/1.0)",
      },
    });
    clearTimeout(timeout);

    if (!pageResponse.ok) {
      return NextResponse.json({ error: "페이지를 불러오지 못했습니다." }, { status: 502 });
    }

    const html = await pageResponse.text();
    pageText = extractTextFromHtml(html).slice(0, 8000);

    if (pageText.length < 30) {
      return NextResponse.json({ error: "페이지에서 분석할 내용을 찾지 못했습니다." }, { status: 422 });
    }
  } catch (err) {
    console.error("[analyze-content] fetch failed", err);
    return NextResponse.json({ error: "페이지를 불러오지 못했습니다." }, { status: 502 });
  }

  const prompt = `너는 숏폼 바이럴 마케팅 전문 분석가다. 아래는 어떤 웹페이지(상세페이지, 블로그, 랜딩페이지 등)에서 추출한 본문 텍스트다.

이 텍스트를 읽고 다음을 분석해줘:
1. targetAudience: 이 콘텐츠/제품/서비스가 노리는 핵심 타깃 고객 (구체적인 특징으로, 한 문장)
2. painPoints: 타깃 고객이 겪고 있는 핵심 고통(Pain Point) 3~5개 (각각 짧고 구체적인 한 문장)
3. coreOffer: 이 페이지가 실제로 제공/판매하는 핵심 제품이나 서비스 (한 문장)
4. summary: 페이지 내용 요약 (1~2문장)

페이지 본문:
${pageText}`;

  try {
    const response = await fetch(geminiEndpoint(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[analyze-content] Gemini non-OK response", response.status, errBody);
      return NextResponse.json({ error: "분석 요청에 실패했습니다." }, { status: 502 });
    }

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof raw !== "string" || raw.trim() === "") {
      console.error("[analyze-content] no text in candidates", JSON.stringify(data));
      return NextResponse.json({ error: "분석 결과를 받지 못했습니다." }, { status: 502 });
    }

    const analysis = JSON.parse(raw) as ContentAnalysis;
    return NextResponse.json({ analysis, sourceUrl: validUrl.toString() });
  } catch (err) {
    console.error("[analyze-content] caught exception", err);
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
