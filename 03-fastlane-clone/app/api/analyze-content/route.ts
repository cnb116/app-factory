import { NextRequest, NextResponse } from "next/server";
import { getGeminiApiKey, geminiEndpoint } from "@/lib/gemini";
import { buildCrawlTargetUrl, buildFallbackKeyword, extractTextFromHtml, validateCrawlUrl } from "@/lib/extractText";
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

  let pageText = "";
  let usedFallback = false;
  let fallbackSourceUrl: URL | null = null;

  const crawlTargetUrl = buildCrawlTargetUrl(validUrl);
  console.log(
    `[analyze-content] 1/3 크롤링 시작: ${validUrl.toString()}` +
      (crawlTargetUrl !== validUrl.toString() ? ` (네이버 블로그 감지 — 모바일 버전으로 대체 크롤링: ${crawlTargetUrl})` : "")
  );
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const pageResponse = await fetch(crawlTargetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FastlaneCloneBot/1.0)",
      },
    });
    clearTimeout(timeout);

    if (pageResponse.redirected) {
      console.log(`[analyze-content] 리다이렉트 감지 — 최종 도달 URL: ${pageResponse.url}`);
    }

    if (!pageResponse.ok) {
      console.error(`[analyze-content] 크롤링 실패 — HTTP ${pageResponse.status}, URL 키워드로 대체합니다.`);
      usedFallback = true;
      // 쿠팡파트너스(link.coupang.com) 같은 단축 링크는 최종 목적지(www.coupang.com/vp/products/...)까지는
      // fetch가 리다이렉트를 정상적으로 따라가지만, 그 최종 목적지 자체를 Akamai 등 상용 봇 차단이 막아 403을 준다.
      // 이 경우 원래의 의미 없는 단축 URL(예: "link a hs2tqYYPu1") 대신, 리다이렉트로 도달한 실제 상품 URL의
      // 도메인·경로(쿼리스트링의 트래킹 파라미터는 제외)를 fallback 키워드로 써서 최소한 "쿠팡 상품 페이지"라는
      // 맥락은 Gemini에게 전달한다.
      if (pageResponse.redirected) {
        try {
          fallbackSourceUrl = new URL(pageResponse.url);
        } catch {
          // 파싱 실패 시 원본 URL 그대로 사용
        }
      }
    } else {
      const html = await pageResponse.text();
      pageText = extractTextFromHtml(html).slice(0, 8000);

      if (pageText.length < 30) {
        console.error("[analyze-content] 크롤링은 성공했지만 추출된 텍스트가 너무 짧음 — URL 키워드로 대체합니다.");
        usedFallback = true;
      } else {
        console.log(`[analyze-content] 크롤링 성공 — 텍스트 ${pageText.length}자 추출`);
      }
    }
  } catch (err) {
    console.error("[analyze-content] 크롤링 중 예외 발생(타임아웃/네트워크 차단 등) — URL 키워드로 대체합니다.", err);
    usedFallback = true;
  }

  if (usedFallback) {
    pageText = fallbackSourceUrl
      ? buildFallbackKeyword(fallbackSourceUrl, { includeSearch: false })
      : buildFallbackKeyword(validUrl);
    console.log(`[analyze-content] 대체 키워드로 진행: "${pageText}"`);
  }

  const prompt = usedFallback
    ? `너는 숏폼 바이럴 마케팅 전문 분석가다. 아래는 어떤 웹페이지의 URL에서 뽑아낸 도메인명/경로 키워드다(페이지 본문을 직접 가져오지 못해 키워드만 있음).

[주의 — 반드시 지킬 것] 이 키워드만으로는 실제 상품·서비스가 무엇인지 알 수 없는 경우가 많다(예: 쇼핑몰의 짧은 상품 ID만 남는 경우). 키워드에 없는 구체적인 업종(예: "대출", "보험", "부동산" 등)이나 제품명을 절대 지어내지 않는다. 키워드에 쇼핑몰 도메인(쿠팡, 스마트스토어 등)이 보이면 "온라인 쇼핑몰에서 판매하는 실물 상품"이라는 일반적인 범위 안에서만 추론하고, 구체적인 상품 카테고리를 확신할 수 없으면 targetAudience/coreOffer를 "이 상품에 관심 있을 법한 일반 소비자" 수준으로 보수적으로 작성한다.

이 키워드로 이 페이지가 어떤 제품/서비스인지 최대한 합리적으로 추론해서 다음을 분석해줘:
1. targetAudience: 이 콘텐츠/제품/서비스가 노릴 법한 핵심 타깃 고객 (구체적인 특징으로, 한 문장)
2. painPoints: 타깃 고객이 겪고 있을 법한 핵심 고통(Pain Point) 3~5개 (각각 짧고 구체적인 한 문장)
3. coreOffer: 이 페이지가 제공/판매할 것으로 추정되는 핵심 제품이나 서비스 (한 문장)
4. summary: 추론한 내용 요약 (1~2문장)

URL 키워드:
${pageText}`
    : `너는 숏폼 바이럴 마케팅 전문 분석가다. 아래는 어떤 웹페이지(상세페이지, 블로그, 랜딩페이지 등)에서 추출한 본문 텍스트다.

이 텍스트를 읽고 다음을 분석해줘:
1. targetAudience: 이 콘텐츠/제품/서비스가 노리는 핵심 타깃 고객 (구체적인 특징으로, 한 문장)
2. painPoints: 타깃 고객이 겪고 있는 핵심 고통(Pain Point) 3~5개 (각각 짧고 구체적인 한 문장)
3. coreOffer: 이 페이지가 실제로 제공/판매하는 핵심 제품이나 서비스 (한 문장)
4. summary: 페이지 내용 요약 (1~2문장)

페이지 본문:
${pageText}`;

  console.log(`[analyze-content] 2/3 Gemini 호출 시작 (fallback=${usedFallback})`);
  let raw: string;
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
      console.error("[analyze-content] Gemini 호출 실패 — non-OK response", response.status, errBody);
      return NextResponse.json({ error: "분석 요청에 실패했습니다." }, { status: 502 });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string" || text.trim() === "") {
      console.error("[analyze-content] Gemini 응답에 후보 텍스트가 없음", JSON.stringify(data));
      return NextResponse.json({ error: "분석 결과를 받지 못했습니다." }, { status: 502 });
    }

    raw = text;
    console.log("[analyze-content] Gemini 호출 성공, 응답 수신 완료");
  } catch (err) {
    console.error("[analyze-content] Gemini 호출 중 예외 발생(네트워크/타임아웃 등)", err);
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }

  console.log("[analyze-content] 3/3 JSON 파싱 시작");
  try {
    const analysis = JSON.parse(raw) as ContentAnalysis;
    console.log("[analyze-content] JSON 파싱 성공");
    return NextResponse.json({ analysis, sourceUrl: validUrl.toString(), usedFallback });
  } catch (err) {
    console.error("[analyze-content] JSON 파싱 실패 — Gemini 응답이 유효한 JSON이 아님", raw, err);
    return NextResponse.json({ error: "분석 결과 형식이 올바르지 않습니다." }, { status: 502 });
  }
}
