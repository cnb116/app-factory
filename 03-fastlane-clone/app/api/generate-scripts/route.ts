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
    ],
  },
};

export async function POST(request: NextRequest) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  let analysis: Partial<ContentAnalysis> | undefined;
  try {
    const body = await request.json();
    analysis = body?.analysis;
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
hookLine, painAgitation, cta 이 세 항목은 실제로 화자가 말하는 대사이자, Vrew 같은 자막 편집 프로그램에 "한 구간 = 한 클립"으로 그대로 붙여넣을 텍스트다. 문장 중간에 임의로 줄바꿈(\n)을 넣지 않는다 — Vrew는 줄바꿈마다 새 클립으로 쪼개서 인식하기 때문에, 중간에 줄바꿈이 들어가면 영상이 1초 단위로 잘게 끊긴다. 그러므로:
- 문자열 안에 \n을 절대 넣지 않는다 (각 항목은 줄바꿈 없는 한 덩어리의 텍스트).
- 반드시 마침표(.)나 느낌표(!)로 끝나는 온전한 문장으로 쓴다.
- 문장이 여러 개면(painAgitation은 1~2문장 가능) 문장 사이는 줄바꿈이 아니라 띄어쓰기 1칸으로만 구분한다.
예시: hookLine = "저 작년에 10kg 뺐다가 요요로 다시 15kg 쪘습니다."

각 편마다 다음을 채워줘:
- hookType: 사용한 훅 구조 이름 (위 목록의 이름 그대로)
- thumbnailLine1, thumbnailLine2: 영상 0초에 화면에 크게 뜨는 썸네일 볼드 문구 2줄 (각 줄 12자 이내, 강렬하게)
- hookLine: 영상 시작 0~5초에 화자가 실제로 말하는 훅 대사. 온전한 문장 1개 (위 자막 문장 규칙 적용)
- hookSearchKeyword: 0~5초 구간에 깔릴 배경 영상을 Vrew의 내장 무료 비디오 라이브러리에서 검색할 한글 키워드 딱 1단어 (예: "시계", "타이핑", "병원", "충격". hookLine 내용과 어울리는 장면을 상상할 수 있는 구체적인 명사 하나)
- painAgitation: 5~15초, 시청자의 고통을 콕 찌르며 공감시키는 대사. 온전한 문장 1~2개 (위 자막 문장 규칙 적용)
- painSearchKeyword: 5~15초 구간에 깔릴 배경 영상을 Vrew의 내장 무료 비디오 라이브러리에서 검색할 한글 키워드 딱 1단어 (예: "야근", "한숨", "피곤", "서류". painAgitation 내용과 어울리는 장면을 상상할 수 있는 구체적인 명사 하나)
- demoGuide: 15~30초, 실제로 몸으로 보여주거나 시연할 행동을 지시하는 가이드 (연출 지시문 형태 — 화자의 대사가 아니므로 한 문장으로 작성)
- cta: 30~35초, 마무리 행동 유도 대사 (댓글/저장/팔로우 등). 온전한 문장 1개 (위 자막 문장 규칙 적용)
- caption: 유튜브 쇼츠/릴스/틱톡에 공통으로 쓸 수 있는 게시글 캡션 (2~4문장)
- hashtags: 해시태그 8~12개 (# 포함, 한글/영문 혼용 가능)

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
