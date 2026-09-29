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
  "타겟 저격형 — '이거 지금 이런 상황이신 분만 보세요'처럼 특정 조건에 해당하는 시청자만 콕 집어 부르며 시작",
  "비밀 공개형 — '아무도 안 알려주는 비밀인데'로 시작",
  "실패담 공감형 — 시청자가 겪었을 법한 실패 상황을 먼저 재연",
  "초스피드 해결형 — '3초면 끝나는 방법'처럼 속도를 강조하며 시작",
  "넓은 감정형 — 업종과 무관하게 누구나 겪는 넓은 감정(뭔가 준비하다가 시간만 잡아먹힌 경험, 말로 설명하는 게 지겨워진 순간 등)으로 시작",
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

[검증된 바이럴 훅 구조 11가지]
${HOOK_STRUCTURES.map((h, i) => `${i + 1}. ${h}`).join("\n")}

위 11가지 훅 구조 중에서 골고루 섞어 총 10편을 만들어줘. 특정 스타일에 치우치지 말고 다양하게 배분하되, "넓은 감정형"과 "타겟 저격형"은 반드시 각각 최소 1편 이상 포함시킨다. 11가지 중 10편만 쓰면 어쩔 수 없이 1개는 빠지게 되는데, 그럴 때도 이 두 스타일은 절대 빼지 말고 그 외의 스타일 중에서만 하나를 제외한다. 템플릿 문구가 아니라 실제로 그대로 촬영해서 쓸 수 있는 완성된 문장으로 써야 한다.

[자막 문장 규칙 — 반드시 지킬 것]
hookLine, painAgitation, demoGuide, cta 이 네 항목은 전부 실제로 화자가 말하는 대사이자, Vrew 같은 자막 편집 프로그램에 "한 구간 = 한 클립"으로 그대로 붙여넣을 텍스트다. 문장 중간에 임의로 줄바꿈(\n)을 넣지 않는다 — Vrew는 줄바꿈마다 새 클립으로 쪼개서 인식하기 때문에, 중간에 줄바꿈이 들어가면 영상이 1초 단위로 잘게 끊기고, 대사가 없는 구간(연출 지시문 등)이 있으면 그 구간은 오디오가 비어버린다. 그러므로:
- 문자열 안에 \n을 절대 넣지 않는다 (각 항목은 줄바꿈 없는 한 덩어리의 텍스트).
- 반드시 마침표(.)나 느낌표(!)로 끝나는 온전한 문장으로 쓴다.
- 문장이 여러 개면(painAgitation, demoGuide는 1~2문장 가능) 문장 사이는 줄바꿈이 아니라 띄어쓰기 1칸으로만 구분한다.
- 연출 지시문("~하는 연출", "~을 보여준다" 같은 3인칭 설명문)이 아니라, 화자가 직접 시청자에게 말을 거는 1인칭 구어체 문장으로 쓴다.
예시: hookLine = "저 작년에 10kg 뺐다가 요요로 다시 15kg 쪘습니다."
예시: demoGuide = "지저분한 글 넣고 이 노란 버튼 딱 누르면, 공백이랑 줄바꿈이 1초 만에 싹 정리됩니다."

아래 [ ] 안의 원리 이름(호감, 사회적 증거, 권위, 통일성 등)은 너를 위한 내부 지침일 뿐이다 — 실제 대사에 원리 이름이나 괄호 설명을 그대로 쓰지 않고, 자연스러운 구어체 문장 안에만 녹여 넣는다.

[예시 문장 재사용 금지 — 반드시 지킬 것] 이 프롬프트 안에서 따옴표로 감싸 보여주는 모든 예시 문장은 느낌·톤을 보여주기 위한 참고일 뿐이다. 실제 출력에서 그 예시 문장을 그대로 베끼거나 토씨만 살짝 바꿔 쓰지 않는다. 특히 사회적 증거·권위·통일성 구간(아래 painAgitation 두 번째 문장, demoGuide의 경험 문장, cta의 마무리 문장)은 10편 전체에서 같은 문장이 반복되지 않도록 편마다 어휘와 어순을 새로 만든다.

각 편마다 다음을 채워줘:
- hookType: 사용한 훅 구조 이름 (위 목록의 이름 그대로)
- thumbnailLine1, thumbnailLine2: 영상 0초에 화면에 크게 뜨는 썸네일 볼드 문구 2줄 (각 줄 12자 이내, 강렬하게)
- hookLine: 영상 시작 0~5초에 화자가 실제로 말하는 훅 대사. 온전한 문장 1개 (위 자막 문장 규칙 적용)
  [호감(공감) 원리 — 반드시 지킬 것] 시청자를 질책하거나 지적하는 표현("~하는 분들, 그거 핑계입니다", "왜 안 하십니까", "형님들이 왜 못 합니까" 같은 훈계·질책 톤)은 절대 쓰지 않는다. 대신 화자가 자기 경험을 먼저 고백하는 형태로 시작한다 (예: "저도 처음엔 ○○ 때문에 몇 개월을 미뤘습니다." 처럼, 청자가 아니라 화자 자신의 과거 이야기로 문을 연다).
  [넓은 감정형 전용 규칙 — hookType을 "넓은 감정형"으로 쓴 편에서만 반드시 지킬 것] hookLine에 "숏폼", "대본", "쇼츠", "영상"이라는 단어를 절대 쓰지 않는다. 특정 업종·콘텐츠 제작을 연상시키는 표현 대신, "뭔가 준비하다가 시간만 잡아먹힌 경험", "말로 설명하는 게 지겨워진 순간"처럼 업종과 무관하게 누구나 겪어봤을 법한 넓은 감정 하나로 문을 연다. painAgitation부터는 다른 스타일과 동일하게 이 서비스가 해결하는 구체적인 고통으로 자연스럽게 좁혀가고, demoGuide에서는 "그래서 요즘은 이 방법을 씁니다"처럼 자연스러운 연결 문장으로 본 서비스 시연으로 이어간다.
- hookSearchKeyword: 0~5초 구간에 깔릴 배경 영상을 Vrew의 내장 무료 비디오 라이브러리에서 검색할 한글 키워드 딱 1단어 (hookLine 내용과 어울리는 장면을 상상할 수 있는 구체적인 명사 하나)
- painAgitation: 5~15초, 시청자의 고통을 콕 찌르며 공감시키는 대사. 온전한 문장 2개 (위 자막 문장 규칙 적용)
  [사회적 증거 원리 — 반드시 지킬 것] 첫 문장은 기존처럼 고통을 콕 찌르는 문장으로 쓰고, 두 번째 문장은 "나 혼자만 겪는 문제가 아니다"라는 걸 느끼게 하는 문장으로 마무리한다. "저만 그런 게 아니더라고요", "다들 비슷한 이유로 멈춰 있더라고요" 같은 문장을 그대로 베끼지 말고, 이 편의 구체적인 상황에 맞춰 매번 새로운 어휘로 쓴다.
- painSearchKeyword: 5~15초 구간에 깔릴 배경 영상을 Vrew의 내장 무료 비디오 라이브러리에서 검색할 한글 키워드 딱 1단어 (painAgitation 내용과 어울리는 장면을 상상할 수 있는 구체적인 명사 하나)

[hookSearchKeyword·painSearchKeyword 공통 규칙 — 반드시 지킬 것]
Vrew 무료 스톡 영상은 해외 소스가 많아서, 인물이 등장하는 키워드로 검색하면 서구권 외국인이 나오는 컷이 걸려 국내 정서와 안 맞는 장면(외제차, 해외 스카이라인 등)이 섞여 나올 위험이 크다. 그러므로:
- 사람이 아예 등장하지 않아도 내용이 성립하는 사물·공간·행동·상징 키워드를 우선으로 고른다 (예: "시계", "타이핑", "노트북 화면", "시계 초침", "빈 사무실", "종이 뭉치", "손 클로즈업" 등 — 특정 인종·국적이 드러나지 않는 무인물 또는 신체 일부 클로즈업 위주).
- "시계", "타이핑"처럼 이미 무인물이라 안전한 추상 오브젝트 계열은 계속 적극적으로 활용한다.
- 부득이 인물의 감정(답답함, 한숨 등)을 표현해야만 장면이 성립하는 경우에도, 얼굴이 안 보이거나 특정 인종이 두드러지지 않는 구도로 한정한다 (예: "손으로 머리 감싸는 모습", "책상에 엎드린 뒷모습"). 얼굴이 클로즈업되는 키워드는 쓰지 않는다.
- demoGuide: 15~30초, 화면(제품/앱)을 시연하면서 화자가 직접 설명하는 대사. "이 버튼 누르면", "이렇게 화면에 넣으면"처럼 시청자가 지금 화면에서 보고 있을 법한 동작에 맞춰 말하는 느낌으로, 시연 결과(효과·이점)까지 짧게 짚어준다. 온전한 문장 2개 (위 자막 문장 규칙 적용)
  [권위 원리 — 반드시 지킬 것] 기능 설명 문장의 앞이나 뒤에, 직접 겪어본 경험을 근거로 신뢰를 주는 문장을 한 개 넣는다. "전문가라서", "자격증이 있어서" 같은 자격 과시성 표현은 쓰지 않고, 반드시 "직접 해봐서/겪어봐서" 식의 경험 기반 문장으로만 한정한다. "제가 직접 이 방법으로 시작해봐서 압니다"를 그대로 베끼지 말고, 매번 다른 어휘·문장 구조로 새로 쓴다.
- cta: 30~35초, 마무리 행동 유도 대사 (댓글/저장/팔로우 등). 온전한 문장 1개 (위 자막 문장 규칙 적용)
  [통일성(연대감) 원리 — 반드시 지킬 것] 기존처럼 희소성 요소(7일 무료 등)는 그대로 담되, 문장의 마무리는 "당신만 하세요", "여러분만 해보세요"처럼 청자만 콕 집어 행동을 요구하는 어투가 아니라 화자와 청자가 함께 하는 연대감 있는 어투로 끝낸다. "같이 해봅시다", "우리 한번 해봅시다"를 그대로 베끼지 말고, 매번 다른 문장으로 새로 쓴다.
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
