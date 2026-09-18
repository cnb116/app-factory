import { NextRequest, NextResponse } from "next/server";
import { getGeminiApiKey, geminiEndpoint } from "@/lib/gemini";
import { ContentAnalysis, ScriptCard } from "@/lib/types";

const HOOK_STRUCTURES = [
  "충격 고백형 — 화자가 자신의 부끄러운 실패담을 먼저 고백하며 시작",
  "극단적 대조형 — '이렇게 하면 vs 이렇게 하면' 전후 비교로 시작",
  "경고형 — '이거 모르면 무조건 손해봅니다'로 시작",
  "질문 도발형 — 시청자를 콕 찍어 도발적인 질문을 던지며 시작",
  "반전 서사형 — 평범한 상황처럼 시작했다가 중간에 반전이 드러남",
  "통계 충격형 — 충격적인 숫자/통계를 던지며 시작",
  "타겟 저격형 — '이거 ○○하는 분들만 보세요'로 특정 대상을 저격하며 시작",
  "비밀 공개형 — '아무도 안 알려주는 비밀인데'로 시작",
  "실패담 공감형 — 시청자가 겪었을 법한 실패 상황을 먼저 재연",
  "초스피드 해결형 — '3초면 끝나는 방법'처럼 속도를 강조하며 시작",
];

const SCRIPT_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      hookType: { type: "STRING" },
      thumbnailLine1: { type: "STRING" },
      thumbnailLine2: { type: "STRING" },
      hookLine: { type: "STRING" },
      hookSearchKeyword: { type: "STRING" },
      painAgitation: { type: "STRING" },
      painSearchKeyword: { type: "STRING" },
      demoGuide: { type: "STRING" },
      cta: { type: "STRING" },
      caption: { type: "STRING" },
      hashtags: { type: "ARRAY", items: { type: "STRING" } },
      youtubeSeo: {
        type: "OBJECT",
        properties: {
          seoTitle: { type: "STRING" },
          seoDescription: { type: "STRING" },
          tags: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["seoTitle", "seoDescription", "tags"],
      },
      instagramSeo: {
        type: "OBJECT",
        properties: {
          firstLine: { type: "STRING" },
          body: { type: "STRING" },
          hashtags: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["firstLine", "body", "hashtags"],
      },
      tiktokSeo: {
        type: "OBJECT",
        properties: {
          seoCaption: { type: "STRING" },
          hashtags: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["seoCaption", "hashtags"],
      },
    },
    required: [
      "hookType",
      "thumbnailLine1",
      "thumbnailLine2",
      "hookLine",
      "hookSearchKeyword",
      "painAgitation",
      "painSearchKeyword",
      "demoGuide",
      "cta",
      "caption",
      "hashtags",
      "youtubeSeo",
      "instagramSeo",
      "tiktokSeo",
    ],
  },
};

export async function POST(request: NextRequest) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  let analysis: Partial<ContentAnalysis> | undefined;
  let sourceUrl: string | undefined;
  try {
    const body = await request.json();
    analysis = body?.analysis;
    sourceUrl = typeof body?.sourceUrl === "string" ? body.sourceUrl : undefined;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (
    !analysis ||
    typeof analysis.targetAudience !== "string" ||
    typeof analysis.coreOffer !== "string" ||
    !Array.isArray(analysis.painPoints)
  ) {
    return NextResponse.json({ error: "분석 결과가 없습니다." }, { status: 400 });
  }

  const prompt = `너는 숏폼(유튜브 쇼츠/인스타 릴스/틱톡) 바이럴 대본을 전문으로 쓰는 카피라이터다.

[분석된 콘텐츠 정보]
- 타깃 고객: ${analysis.targetAudience}
- 핵심 고통(Pain Point): ${analysis.painPoints.join(" / ")}
- 핵심 제공 가치: ${analysis.coreOffer}

[검증된 바이럴 훅 구조 10가지]
${HOOK_STRUCTURES.map((h, i) => `${i + 1}. ${h}`).join("\n")}

위 10가지 훅 구조를 각각 하나씩 사용해서, 위 타깃 고객/고통/제공 가치에 딱 맞는 완성형 숏폼 대본 10편을 만들어줘. 템플릿 문구가 아니라 실제로 그대로 촬영해서 쓸 수 있는 완성된 문장으로 써야 한다.

[자막 문장 규칙 — 반드시 지킬 것]
hookLine, painAgitation, demoGuide, cta 이 네 항목은 전부 실제로 화자가 말하는 대사이자, Vrew 같은 자막 편집 프로그램에 "한 구간 = 한 클립"으로 그대로 붙여넣을 텍스트다. 문장 중간에 임의로 줄바꿈(\n)을 넣지 않는다 — Vrew는 줄바꿈마다 새 클립으로 쪼개서 인식하기 때문에, 중간에 줄바꿈이 들어가면 영상이 1초 단위로 잘게 끊기고, 대사가 없는 구간(연출 지시문 등)이 있으면 그 구간은 오디오가 비어버린다. 그러므로:
- 문자열 안에 \n을 절대 넣지 않는다 (각 항목은 줄바꿈 없는 한 덩어리의 텍스트).
- 반드시 마침표(.)나 느낌표(!)로 끝나는 온전한 문장으로 쓴다.
- 문장이 여러 개면(painAgitation, demoGuide는 1~2문장 가능) 문장 사이는 줄바꿈이 아니라 띄어쓰기 1칸으로만 구분한다.
- 연출 지시문("~하는 연출", "~을 보여준다" 같은 3인칭 설명문)이 아니라, 화자가 직접 시청자에게 말을 거는 1인칭 구어체 문장으로 쓴다.
예시: hookLine = "저 작년에 10kg 뺐다가 요요로 다시 15kg 쪘습니다."
예시: demoGuide = "지저분한 글 넣고 이 노란 버튼 딱 누르면, 공백이랑 줄바꿈이 1초 만에 싹 정리됩니다."

각 편마다 다음을 채워줘:
- hookType: 사용한 훅 구조 이름 (위 목록의 이름 그대로)
- thumbnailLine1, thumbnailLine2: 영상 0초에 화면에 크게 뜨는 썸네일 볼드 문구 2줄 (각 줄 12자 이내, 강렬하게)
- hookLine: 영상 시작 0~5초에 화자가 실제로 말하는 훅 대사. 온전한 문장 1개 (위 자막 문장 규칙 적용)
- hookSearchKeyword: 0~5초 구간에 깔릴 배경 영상을 Vrew의 내장 무료 비디오 라이브러리에서 검색할 한글 키워드 딱 1단어 (예: "시계", "타이핑", "병원", "충격". hookLine 내용과 어울리는 장면을 상상할 수 있는 구체적인 명사 하나)
- painAgitation: 5~15초, 시청자의 고통을 콕 찌르며 공감시키는 대사. 온전한 문장 1~2개 (위 자막 문장 규칙 적용)
- painSearchKeyword: 5~15초 구간에 깔릴 배경 영상을 Vrew의 내장 무료 비디오 라이브러리에서 검색할 한글 키워드 딱 1단어 (예: "야근", "한숨", "피곤", "서류". painAgitation 내용과 어울리는 장면을 상상할 수 있는 구체적인 명사 하나)
- demoGuide: 15~30초, 화면(제품/앱)을 시연하면서 화자가 직접 설명하는 대사. "이 버튼 누르면", "이렇게 화면에 넣으면"처럼 시청자가 지금 화면에서 보고 있을 법한 동작에 맞춰 말하는 느낌으로, 시연 결과(효과·이점)까지 짧게 짚어준다. 온전한 문장 1~2개 (위 자막 문장 규칙 적용)
- cta: 30~35초, 마무리 행동 유도 대사 (댓글/저장/팔로우 등). 온전한 문장 1개 (위 자막 문장 규칙 적용)
- caption: 유튜브 쇼츠/릴스/틱톡에 공통으로 쓸 수 있는 게시글 캡션 (2~4문장)
- hashtags: 해시태그 8~12개 (# 포함, 한글/영문 혼용 가능)

[플랫폼별 SEO 메타데이터 — 위 caption/hashtags와는 별개로 채널마다 알고리즘·검색 특성에 맞춰 따로 최적화해서 채워줘]

- youtubeSeo (유튜브 쇼츠는 "검색" 기반 유입이 크다 — 검색 키워드를 반복 노출시키는 게 핵심):
  - seoTitle: 60자 이내. 핵심 검색 키워드를 앞쪽에 배치하고 클릭을 유도하는 어그로 문구를 더한 제목
  - seoDescription: 핵심 검색 키워드를 자연스럽게 3번 반복해서 넣은 설명 문단 + "${sourceUrl ?? "프로필 링크"}" 언급 + 고정 댓글을 유도하는 CTA 한 줄("궁금하신 분은 고정 댓글 확인하세요" 등)까지 포함해서 3~4문장으로 작성
  - tags: 검색량이 높을 법한 키워드 10개, 쉼표로 구분할 문자열 배열 (# 없이 순수 키워드)
- instagramSeo (릴스는 "탐색 탭 노출/저장·공유" 기반이 크다 — 첫 줄로 스크롤을 멈추고, 저장하게 만드는 게 핵심):
  - firstLine: 피드에서 스크롤 멈추게 만드는 시선을 끄는 한 줄
  - body: "저장해두세요", "공유해서 알려주세요" 같은 저장/공유를 직접 유도하는 멘트 포함 2~3문장
  - hashtags: 총 3~5개만. 팔로워/도달이 큰 대형 키워드 해시태그 2개 + 타깃이 좁은 중소형 키워드 해시태그 3개로 구성(# 포함)
- tiktokSeo (틱톡은 "질문형 검색"이 많다 — 사람들이 검색창에 그대로 칠 법한 질문 형태가 핵심):
  - seoCaption: "~하는 법?", "~할 때 뭐 써요?"처럼 사람들이 틱톡 검색창에 직접 타이핑할 법한 질문형 문장으로 작성
  - hashtags: 검색 랭킹에 잡히는 핵심 키워드 해시태그 + 그 시점 트렌드성 해시태그를 섞어 4개 내외(# 포함)

10편 모두 순서를 지켜서 배열로 반환해줘.`;

  console.log("[generate-scripts] 1/2 Gemini 호출 시작");
  let raw: string;
  try {
    const response = await fetch(geminiEndpoint(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: SCRIPT_SCHEMA,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[generate-scripts] Gemini 호출 실패 — non-OK response", response.status, errBody);
      return NextResponse.json({ error: "대본 생성에 실패했습니다." }, { status: 502 });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string" || text.trim() === "") {
      console.error("[generate-scripts] Gemini 응답에 후보 텍스트가 없음", JSON.stringify(data));
      return NextResponse.json({ error: "대본 결과를 받지 못했습니다." }, { status: 502 });
    }

    raw = text;
    console.log("[generate-scripts] Gemini 호출 성공, 응답 수신 완료");
  } catch (err) {
    console.error("[generate-scripts] Gemini 호출 중 예외 발생(네트워크/타임아웃 등)", err);
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }

  console.log("[generate-scripts] 2/2 JSON 파싱 시작");
  try {
    const parsed = JSON.parse(raw) as Omit<ScriptCard, "id">[];
    const cards: ScriptCard[] = parsed.map((card, i) => ({ ...card, id: String(i + 1) }));
    console.log(`[generate-scripts] JSON 파싱 성공 — ${cards.length}편 생성됨`);
    return NextResponse.json({ cards });
  } catch (err) {
    console.error("[generate-scripts] JSON 파싱 실패 — Gemini 응답이 유효한 JSON이 아님", raw, err);
    return NextResponse.json({ error: "대본 결과 형식이 올바르지 않습니다." }, { status: 502 });
  }
}
