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

// "넓은 감정형" 훅은 프롬프트에 "최소 3종 필수"를 명시해도 실제 생성에서 0편이 나오는 경우가 반복 확인되어
// (CTA 반복 문제와 동일한 패턴 — 프롬프트 지시만으로는 구조적 보장이 안 됨), 생성 직후 코드로 개수를 집계하고
// 부족하면 다른 대본의 "훅 구간만"(hookType/썸네일/hookLine/hookSearchKeyword) 넓은 감정형으로 다시 쓰게 한다.
// painAgitation부터 이어지는 본문·CTA·SEO 메타데이터는 그대로 유지한다.
const BROAD_HOOK_TYPE = "넓은 감정형";
const PROTECTED_HOOK_TYPE = "타겟 저격형"; // 최소 1편 보장 규칙을 깨지 않도록 교체 후보에서 최대한 제외
const MIN_BROAD_HOOK = 3; // 10편 기준 최소 보장 개수
const MIN_BROAD_HOOK_BASE_COUNT = 10;

function getMinBroadHookCount(totalCards: number): number {
  if (totalCards <= 0) return 0;
  return Math.max(1, Math.round((MIN_BROAD_HOOK / MIN_BROAD_HOOK_BASE_COUNT) * totalCards));
}

// 교체할 카드를 고른다: 이미 넓은 감정형인 카드는 건드리지 않고, 타겟 저격형은 최소 1편이 남도록 보호한 뒤
// 그 외 스타일부터 우선적으로 채워 넣는다. 교체 가능한 카드가 부족하면 있는 만큼만 선택한다(강제로 규칙을 깨지 않음).
function selectCardsForBroadHookConversion(
  cards: ScriptCard[],
  neededCount: number
): number[] {
  const protectedTargetedBudget = Math.min(1, cards.filter((c) => c.hookType === PROTECTED_HOOK_TYPE).length);
  let targetedProtectedRemaining = protectedTargetedBudget;

  const nonTargetedIndexes: number[] = [];
  const targetedIndexes: number[] = [];

  cards.forEach((card, i) => {
    if (card.hookType === BROAD_HOOK_TYPE) return;
    if (card.hookType === PROTECTED_HOOK_TYPE) {
      targetedIndexes.push(i);
    } else {
      nonTargetedIndexes.push(i);
    }
  });

  const selected: number[] = [];
  for (const i of nonTargetedIndexes) {
    if (selected.length >= neededCount) break;
    selected.push(i);
  }
  for (const i of targetedIndexes) {
    if (selected.length >= neededCount) break;
    // 타겟 저격형 보호분(최소 1편)을 깎아 먹지 않는 한도 내에서만 추가로 교체 후보에 포함한다.
    if (targetedIndexes.length - targetedProtectedRemaining <= 0) break;
    targetedProtectedRemaining -= 1;
    selected.push(i);
  }

  return selected;
}

interface BroadHookFields {
  hookType: string;
  thumbnailLine1: string;
  thumbnailLine2: string;
  hookLine: string;
  hookSearchKeyword: string;
}

const BROAD_HOOK_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      hookType: { type: "STRING" },
      thumbnailLine1: { type: "STRING" },
      thumbnailLine2: { type: "STRING" },
      hookLine: { type: "STRING" },
      hookSearchKeyword: { type: "STRING" },
    },
    required: ["hookType", "thumbnailLine1", "thumbnailLine2", "hookLine", "hookSearchKeyword"],
  },
};

function buildBroadHookPrompt(analysis: Partial<ContentAnalysis>, cardsToConvert: ScriptCard[]): string {
  const painPoints = Array.isArray(analysis.painPoints) ? analysis.painPoints.join(" / ") : "";
  const items = cardsToConvert
    .map(
      (card, i) =>
        `${i + 1}. 이어지는 painAgitation(참고용 — 이 문장으로 자연스럽게 연결되도록 훅을 써라): "${card.painAgitation}"`
    )
    .join("\n");

  return `너는 숏폼 바이럴 대본의 "훅(hook)" 구간만 다시 쓰는 전문가다.

[분석된 콘텐츠 정보]
- 타깃 고객: ${analysis.targetAudience ?? ""}
- 핵심 고통(Pain Point): ${painPoints}
- 핵심 제공 가치: ${analysis.coreOffer ?? ""}

아래 ${cardsToConvert.length}개 대본의 훅을 전부 "넓은 감정형" 스타일로 새로 써라. 각 대본에 바로 이어지는 painAgitation은 그대로 유지되니, 새 훅이 그 문장으로 자연스럽게 이어지도록 써야 한다.

[넓은 감정형 스타일 정의 — 반드시 지킬 것]
업종과 무관하게 누구나 겪는 넓은 감정(뭔가 준비하다가 시간만 잡아먹힌 경험, 말로 설명하는 게 지겨워진 순간 등)으로 연다.
- hookLine에 "숏폼", "대본", "쇼츠", "영상"이라는 단어를 절대 쓰지 않는다.
- "${analysis.targetAudience ?? ""}"나 [분석된 콘텐츠 정보]에만 등장하는 구체적인 도구명·서비스명·업종명을 쓰지 않는다. 보편적 감정만으로 연다.
- 마침표(.)나 느낌표(!)로 끝나는 온전한 문장 1개. 문장 중간에 줄바꿈을 넣지 않는다.
- 이 프롬프트의 예시 문장을 그대로 베끼지 않는다.
예시(참고용, 베끼지 말 것): "뭔가 정리해서 남한테 보여줘야 하는데, 늘 손이 많이 가서 자꾸 미루게 되는 거 있으시죠?"

[다시 써야 할 대본 목록]
${items}

각 항목마다 다음을 채워 배열로 반환해줘 (순서는 위 목록 순서 그대로):
- hookType: 항상 "넓은 감정형" 고정
- thumbnailLine1, thumbnailLine2: 영상 0초에 화면에 크게 뜨는 썸네일 볼드 문구 2줄 (각 줄 12자 이내)
- hookLine: 위 규칙을 지킨 새 훅 대사
- hookSearchKeyword: Vrew 무료 비디오 라이브러리에서 검색할 한글 키워드 1단어 (무인물 또는 신체 일부 클로즈업 위주 — 예: "시계", "타이핑", "빈 사무실")`;
}

// 넓은 감정형 비율이 기준 미달이면 부족분만큼만 묶어서 Gemini에 재요청한다(요청 1회로 최소화).
// 재요청이 실패(네트워크 오류, 응답 형식 불일치 등)하면 원본 cards를 그대로 반환해 전체 생성이 깨지지 않게 한다.
async function enforceMinBroadHookRatio(
  cards: ScriptCard[],
  analysis: Partial<ContentAnalysis>,
  apiKey: string
): Promise<{ cards: ScriptCard[]; convertedCount: number; geminiCallMade: boolean }> {
  const currentBroadCount = cards.filter((c) => c.hookType === BROAD_HOOK_TYPE).length;
  const minRequired = getMinBroadHookCount(cards.length);
  const shortfall = minRequired - currentBroadCount;

  if (shortfall <= 0) {
    return { cards, convertedCount: 0, geminiCallMade: false };
  }

  const targetIndexes = selectCardsForBroadHookConversion(cards, shortfall);
  if (targetIndexes.length === 0) {
    console.warn("[generate-scripts] 넓은 감정형 부족하지만 교체 가능한 카드가 없어 보정을 건너뜀");
    return { cards, convertedCount: 0, geminiCallMade: false };
  }

  const cardsToConvert = targetIndexes.map((i) => cards[i]);
  const prompt = buildBroadHookPrompt(analysis, cardsToConvert);

  try {
    const response = await fetch(geminiEndpoint(apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: BROAD_HOOK_SCHEMA,
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[generate-scripts] 넓은 감정형 보정 호출 실패 — non-OK response", response.status, errBody);
      return { cards, convertedCount: 0, geminiCallMade: true };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || text.trim() === "") {
      console.error("[generate-scripts] 넓은 감정형 보정 응답에 후보 텍스트가 없음");
      return { cards, convertedCount: 0, geminiCallMade: true };
    }

    const parsed = JSON.parse(text) as BroadHookFields[];
    if (!Array.isArray(parsed) || parsed.length !== targetIndexes.length) {
      console.error(
        `[generate-scripts] 넓은 감정형 보정 응답 개수 불일치 — 기대 ${targetIndexes.length}, 실제 ${Array.isArray(parsed) ? parsed.length : "배열 아님"}`
      );
      return { cards, convertedCount: 0, geminiCallMade: true };
    }

    const updated = [...cards];
    targetIndexes.forEach((cardIndex, i) => {
      const newHook = parsed[i];
      if (
        !newHook ||
        typeof newHook.hookLine !== "string" ||
        typeof newHook.thumbnailLine1 !== "string" ||
        typeof newHook.thumbnailLine2 !== "string" ||
        typeof newHook.hookSearchKeyword !== "string"
      ) {
        return; // 이 카드만 원본 유지, 나머지는 정상 반영
      }
      updated[cardIndex] = {
        ...updated[cardIndex],
        hookType: BROAD_HOOK_TYPE,
        thumbnailLine1: newHook.thumbnailLine1,
        thumbnailLine2: newHook.thumbnailLine2,
        hookLine: newHook.hookLine,
        hookSearchKeyword: newHook.hookSearchKeyword,
      };
    });

    return { cards: updated, convertedCount: targetIndexes.length, geminiCallMade: true };
  } catch (err) {
    console.error("[generate-scripts] 넓은 감정형 보정 중 예외 발생 — 원본 유지", err);
    return { cards, convertedCount: 0, geminiCallMade: true };
  }
}

// CTA는 "통일성(연대감) 원리" 때문에 "우리 ... 함께/같이/모두 ~해봅시다" 류의 연대감 표현이 반복되기 쉽다.
// 주어(우리/다들/여러분)와 연결어(함께/같이/모두)는 "우리 함께 ~"처럼 붙어 있을 때도 있고,
// "우리 더 이상 ~하지 말고 같이 ~해봅시다"처럼 문장 안에서 서로 떨어져 있을 때도 있어서,
// 구문(phrase) 단위로 매칭하면 Gemini가 문장 구조를 바꿀 때마다 쉽게 놓친다. 그래서 두 단어를
// 각각 독립적으로(문장 어디에 있든) 찾아 따로 치환하는 방식을 쓴다 — 어떤 문장 구조든 안정적으로 잡아낸다.
// 프롬프트 지시("매번 다르게 쓰라")만으로는 어휘 수준 다양화는 되지만 이 패턴 자체의 반복까지는
// 못 막는다는 게 실제 생성 결과로 여러 번 확인되어, 생성이 끝난 뒤 코드로 쏠림을 검사하고 초과분만
// 결정론적으로 바꿔치기한다(추가 Gemini 호출 없음 — 실패 지점을 늘리지 않기 위해 템플릿 치환 방식을 택했다).
// 치환 대상 단어 외의 나머지 문장(의미, 희소성 문구)은 그대로 유지한다.
const CTA_SUBJECT_REGEX = /우리|다들|여러분/;
const CTA_CONNECTOR_WORD_REGEX = /(?<!똑)함께|(?<!똑)같이|모두/;
const CTA_SUBJECT_POOL = ["우리", "다들", "여러분도"];
const CTA_CONNECTOR_POOL = ["함께", "같이"];

function pickDifferent(pool: string[], exclude: string, cursor: { i: number }): string {
  let candidate = pool[cursor.i % pool.length];
  cursor.i++;
  while (candidate === exclude) {
    candidate = pool[cursor.i % pool.length];
    cursor.i++;
  }
  return candidate;
}

// 10편 중 "주어+연결어"가 둘 다 있는 연대감 톤 CTA가 40%(기본 4편)를 넘으면, 처음 등장한 것들은
// 그대로 두고 그 이후(5번째~)만 주어·연결어 단어를 다른 연대감 표현으로 교체한다.
function diversifyCtaOpeners(cards: ScriptCard[]): { cards: ScriptCard[]; replacedCount: number } {
  const infos = cards.map((card) => {
    const subjectMatch = card.cta.match(CTA_SUBJECT_REGEX);
    const connectorMatch = card.cta.match(CTA_CONNECTOR_WORD_REGEX);
    return { hasPattern: Boolean(subjectMatch && connectorMatch), subjectMatch, connectorMatch };
  });
  const matchedCount = infos.filter((info) => info.hasPattern).length;
  const threshold = Math.max(1, Math.ceil(cards.length * 0.4));

  if (matchedCount <= threshold) {
    return { cards, replacedCount: 0 };
  }

  let keepBudget = threshold;
  const subjectCursor = { i: 0 };
  const connectorCursor = { i: 0 };
  let replacedCount = 0;

  const result = cards.map((card, idx) => {
    const info = infos[idx];
    if (!info.hasPattern || !info.subjectMatch || !info.connectorMatch) return card;

    if (keepBudget > 0) {
      keepBudget--;
      return card;
    }

    let cta = card.cta;
    const newConnector = pickDifferent(CTA_CONNECTOR_POOL, info.connectorMatch[0], connectorCursor);
    cta = cta.replace(CTA_CONNECTOR_WORD_REGEX, newConnector);
    const newSubject = pickDifferent(CTA_SUBJECT_POOL, info.subjectMatch[0], subjectCursor);
    cta = cta.replace(CTA_SUBJECT_REGEX, newSubject);

    // 원문에 연결어가 이미 2번 이상 있었던 경우(예: "...함께 ... 함께 써봅시다") 첫 번째만 바꾸면
    // "함께 함께"처럼 어색하게 붙어버릴 수 있다. 이런 부작용이 생기면 치환을 포기하고 원문을 그대로 둔다
    // — 쏠림보다 문법이 깨지는 게 더 나쁘다.
    if (/(함께|같이|모두)\s+(함께|같이|모두)/.test(cta)) {
      return card;
    }

    replacedCount++;
    return { ...card, cta };
  });

  return { cards: result, replacedCount };
}

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

[감정 축 다양화 — 반드시 지킬 것] painAgitation과 demoGuide는 문장 표현뿐 아니라 "어떤 종류의 고통/효과를 강조하는지"도 10편 전체에서 다양하게 섞어야 한다. 아래 감정 축 중에서 [분석된 콘텐츠 정보]의 painPoints/coreOffer가 실제로 뒷받침하는 축들을 골라 편마다 다른 축을 배정한다 — 절대 10편 모두 같은 축(예: 전부 "시간 낭비")으로 몰리지 않게 한다.
- 시간 낭비: 이 문제 때문에 시간을 허비한다
- 돈 낭비: 이 문제 때문에 불필요한 지출·손해가 생긴다
- 막막함/모름: 뭘 어떻게 해야 할지 몰라 막막하다
- 번거로움/귀찮음: 절차가 복잡하고 손이 많이 간다
- 결정 장애/선택 피로: 선택지가 너무 많아 고르기 지친다
- 미루는 습관/자괴감: 계속 미루다가 자신에게 실망한다
painAgitation에서 고른 감정 축은 demoGuide의 효과 설명(시간이 절약된다/비용이 준다/막막함이 해소된다/수고가 준다 등)과 자연스럽게 이어지게 짝지어 쓴다.

각 편마다 다음을 채워줘:
- hookType: 사용한 훅 구조 이름 (위 목록의 이름 그대로)
- thumbnailLine1, thumbnailLine2: 영상 0초에 화면에 크게 뜨는 썸네일 볼드 문구 2줄 (각 줄 12자 이내, 강렬하게)
- hookLine: 영상 시작 0~5초에 화자가 실제로 말하는 훅 대사. 온전한 문장 1개 (위 자막 문장 규칙 적용)
  [호감(공감) 원리 — 반드시 지킬 것] 시청자를 질책하거나 지적하는 표현("~하는 분들, 그거 핑계입니다", "왜 안 하십니까", "형님들이 왜 못 합니까" 같은 훈계·질책 톤)은 절대 쓰지 않는다. 대신 화자가 자기 경험을 먼저 고백하는 형태로 시작한다 (예: "저도 처음엔 ○○ 때문에 몇 개월을 미뤘습니다." 처럼, 청자가 아니라 화자 자신의 과거 이야기로 문을 연다).
  [넓은 소재 우선 원칙 — "넓은 감정형", "통계 충격형", "타겟 저격형"을 제외한 나머지 8종(충격 고백형, 극단적 대조형, 경고형, 질문 도발형, 반전 서사형, 비밀 공개형, 실패담 공감형, 초스피드 해결형) 중 최소 3종은 반드시 지킬 것 — 선택이 아니라 최소 요건] 이 8종 중 최소 3종 이상의 hookLine에는 "${analysis.targetAudience}"나 [분석된 콘텐츠 정보]에만 등장하는 구체적인 도구명·서비스명·행동명(예: 카카오톡, 메모장, 블로그, 크리에이터, 쇼핑몰, 사장님, 보고서, 원고 등)을 단 하나도 쓰지 않는다. 대신 그 도구·행동이 유발하는 보편적 감정(시간 낭비, 돈 낭비, 막막함, 결정 장애, 미루는 습관, 자괴감 등)만으로 연다. 10편을 다 쓴 뒤 스스로 "이 8종 중 도구명이 하나도 없는 hookLine이 3편 이상인가?"를 확인하고, 아니라면 일부를 다시 넓게 고쳐라.
    - 나쁜 예(금지): "카카오톡이나 메모장에서 복사한 지저분한 텍스트를 언제까지 일일이 수정하고 계실 건가요?"
    - 나쁜 예(금지): "메모장에 쓴 글을 블로그나 보고서에 옮길 때마다 엉망이 된 줄바꿈을 언제까지 직접 지우고 계실 건가요?"
    - 나쁜 예(금지): "블로그 원고나 보고서를 매일 작성하면서 텍스트 정리 때문에 머리가 아프신 분들만..."
    - 좋은 예(이렇게 열 것): "뭔가 정리해서 남한테 보여줘야 하는데, 늘 손이 많이 가서 자꾸 미루게 되는 거 있으시죠?"
    - 좋은 예(이렇게 열 것): "뭔가 하나 끝내놓고 싶었는데 자잘한 손길이 너무 많이 가서 지쳐버린 적 있으신가요?"
  hookLine이 이렇게 넓게 열려도 painAgitation부터는 반드시 [분석된 콘텐츠 정보]의 실제 타깃/고통/도구로 자연스럽게 좁혀 들어가며 본 서비스로 이어간다.
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
  [사실 왜곡 금지 — 반드시 지킬 것, 모든 URL에 공통 적용] 실제로 써본 적 없는 제품의 사용 결과를 지어내지 않는다. demoGuide에 시간·온도·퍼센트 같은 숫자를 쓰려면, 그 숫자가 [분석된 콘텐츠 정보](targetAudience/painPoints/coreOffer/summary)에 이미 등장하는 숫자인지 먼저 확인한다 — 있으면 그 숫자를 그대로 인용해도 되지만, 없는 숫자는 절대로 새로 지어내지 않는다(원본에 있는 숫자를 비슷한 다른 숫자로 바꿔 쓰는 것도 금지). "안전 인증", "화재 위험 없음", "검증된 제품"처럼 사실 확인이 필요한 안전·품질·인증 주장도 절대 만들지 않는다. demoGuide의 기능 설명은 반드시 [분석된 콘텐츠 정보]에 있는 내용 범위 안에서만 쓰고, 원본 페이지에 없는 스펙이나 효과를 새로 지어내지 않는다 — 대신 "이 제품이 가진 특징은 이렇습니다", "이런 분들께 맞는 제품입니다"처럼 이미 알려진 정보를 소개하는 화법을 쓴다. 단, 숫자가 전혀 없는 일반적인 경험 기반 신뢰 문장("제가 직접 이 방법을 써보니 도움이 됐습니다" 등)은 계속 써도 된다 — 텍스트 정리기 같은 자체 소프트웨어를 다룰 때는 이 표현을 지금처럼 자유롭게 쓴다.
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
    const rawCards: ScriptCard[] = parsed.map((card, i) => ({ ...card, id: String(i + 1) }));
    console.log(`[generate-scripts] JSON 파싱 성공 — ${rawCards.length}편 생성됨`);

    // 1) 훅 보정: 넓은 감정형 최소 비율 미달 시 부족분만큼 묶어서 재요청
    const broadHookResult = await enforceMinBroadHookRatio(rawCards, analysis, apiKey);
    if (broadHookResult.convertedCount > 0) {
      console.log(
        `[generate-scripts] 넓은 감정형 부족 감지 — ${broadHookResult.convertedCount}편의 훅을 넓은 감정형으로 재생성함`
      );
    } else if (broadHookResult.geminiCallMade) {
      console.warn("[generate-scripts] 넓은 감정형 보정 호출은 했으나 반영 실패 — 원본 훅 유지");
    }

    // 2) CTA 후처리: 시작 어구 쏠림 교체 (훅 보정 다음 순서로 실행)
    const { cards, replacedCount } = diversifyCtaOpeners(broadHookResult.cards);
    if (replacedCount > 0) {
      console.log(`[generate-scripts] CTA 시작 어구 쏠림 감지 — ${replacedCount}편의 시작 어구를 후처리로 교체함`);
    }

    return NextResponse.json({ cards });
  } catch (err) {
    console.error("[generate-scripts] JSON 파싱 실패 — Gemini 응답이 유효한 JSON이 아님", raw, err);
    return NextResponse.json({ error: "대본 결과 형식이 올바르지 않습니다." }, { status: 502 });
  }
}
