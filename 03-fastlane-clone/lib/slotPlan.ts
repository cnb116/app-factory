// 생성 요청 전에 코드가 10칸 각각의 "스타일 + 감정"을 미리 배정한다.
// (Gemini가 11종 스타일을 알아서 고르게 두면 넓은 감정형을 거의 안 골라 사후 보정이 매번 필요했다.)

export const HOOK_STRUCTURES = [
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

export const BROAD_HOOK_TYPE = "넓은 감정형";
export const TARGETED_HOOK_TYPE = "타겟 저격형"; // 매 요청 고정 1칸

export function getHookTypeName(structure: string): string {
  return structure.split(" — ")[0].trim();
}

export function findHookStructure(hookType: string): string | undefined {
  return HOOK_STRUCTURES.find((s) => getHookTypeName(s) === hookType.trim());
}

export type EmotionTone = "dark" | "bright";

export interface EmotionDef {
  name: string;
  tone: EmotionTone;
  hint: string;
}

export const DARK_EMOTIONS: EmotionDef[] = [
  { name: "막막함", tone: "dark", hint: "뭘 어떻게 시작해야 할지 몰라 앞이 캄캄한 느낌" },
  { name: "후회", tone: "dark", hint: "그때 그렇게 하지 말 걸, 더 일찍 알았더라면 하고 아쉬운 느낌" },
  { name: "답답함", tone: "dark", hint: "애쓰는데도 좀처럼 풀리지 않아 속이 꽉 막힌 느낌" },
  { name: "비교", tone: "dark", hint: "남들은 쉽게 잘 하는 것 같은데 나만 뒤처진 것 같은 느낌" },
  { name: "불안", tone: "dark", hint: "이대로 괜찮을지, 뭔가 놓치고 있는 건 아닌지 마음이 조마조마한 느낌" },
  { name: "지침", tone: "dark", hint: "하다 하다 기운이 다 빠져 더 하기 싫어진 느낌" },
];

export const BRIGHT_EMOTIONS: EmotionDef[] = [
  { name: "뿌듯함", tone: "bright", hint: "뭔가 해냈을 때 마음이 차오르는 흐뭇한 느낌" },
  { name: "여유", tone: "bright", hint: "서두르지 않아도 되는 느긋하고 가벼운 느낌" },
  { name: "설렘", tone: "bright", hint: "곧 좋은 일이 생길 것 같아 기대로 마음이 들뜨는 느낌" },
];

export const EMOTION_BY_NAME: Record<string, EmotionDef> = Object.fromEntries(
  [...DARK_EMOTIONS, ...BRIGHT_EMOTIONS].map((e) => [e.name, e])
);

// 10편 기준 칸 구성: 넓은 감정형 3(어두운 감정 2 + 밝은 감정 1, 감정 중복 없음) + 타겟 저격형 1 + 나머지 스타일 6(중복 없음)
export const TOTAL_SLOTS = 10;
export const BROAD_DARK_COUNT = 2;
export const BROAD_BRIGHT_COUNT = 1;
export const BROAD_SLOT_COUNT = BROAD_DARK_COUNT + BROAD_BRIGHT_COUNT;

// 스타일별 추가 규칙 확장 자리 — 나중에 예: "통계 충격형": ["숫자는 분석 정보에 있는 것만 쓴다"] 처럼 얹는다.
// 비어 있지 않으면 해당 칸의 프롬프트 배정 줄에 "추가 규칙"으로 자동 표시된다. (이번에는 규칙 내용을 넣지 않는다)
export const STYLE_EXTRA_RULES: Record<string, string[]> = {};

export interface SlotAssignment {
  slot: number; // 1부터 시작
  hookType: string;
  emotion: EmotionDef | null; // 넓은 감정형 칸에서만 값이 있다
  extraRules: string[];
}

type Rng = () => number;

function shuffle<T>(items: T[], rng: Rng): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function hasAdjacentBroad(items: { hookType: string }[]): boolean {
  for (let i = 0; i < items.length - 1; i++) {
    if (items[i].hookType === BROAD_HOOK_TYPE && items[i + 1].hookType === BROAD_HOOK_TYPE) return true;
  }
  return false;
}

export function buildSlotPlan(rng: Rng = Math.random): SlotAssignment[] {
  const otherStyles = HOOK_STRUCTURES.map(getHookTypeName).filter(
    (n) => n !== BROAD_HOOK_TYPE && n !== TARGETED_HOOK_TYPE
  );
  const pickedStyles = shuffle(otherStyles, rng).slice(0, TOTAL_SLOTS - BROAD_SLOT_COUNT - 1);

  const emotions = [
    ...shuffle(DARK_EMOTIONS, rng).slice(0, BROAD_DARK_COUNT),
    ...shuffle(BRIGHT_EMOTIONS, rng).slice(0, BROAD_BRIGHT_COUNT),
  ];

  const items: { hookType: string; emotion: EmotionDef | null }[] = [
    ...emotions.map((emotion) => ({ hookType: BROAD_HOOK_TYPE, emotion })),
    { hookType: TARGETED_HOOK_TYPE, emotion: null },
    ...pickedStyles.map((hookType) => ({ hookType, emotion: null })),
  ];

  // 넓은 감정형 3칸이 서로 붙지 않을 때까지 섞는다(무작위 배치 중 약 절반이 조건을 만족하므로 곧 끝난다).
  let placed = shuffle(items, rng);
  for (let attempt = 0; attempt < 500 && hasAdjacentBroad(placed); attempt++) {
    placed = shuffle(items, rng);
  }
  if (hasAdjacentBroad(placed)) {
    const broad = items.filter((i) => i.hookType === BROAD_HOOK_TYPE);
    const rest = shuffle(items.filter((i) => i.hookType !== BROAD_HOOK_TYPE), rng);
    const broadPositions = new Set([1, 4, 8]);
    let bi = 0;
    let ri = 0;
    placed = Array.from({ length: items.length }, (_, idx) => (broadPositions.has(idx) ? broad[bi++] : rest[ri++]));
  }

  return placed.map((item, idx) => ({
    slot: idx + 1,
    hookType: item.hookType,
    emotion: item.emotion,
    extraRules: STYLE_EXTRA_RULES[item.hookType] ?? [],
  }));
}

export function describeSlotPlan(plan: SlotAssignment[]): string {
  return plan
    .map((s) => `${s.slot}:${s.hookType}${s.emotion ? `(${s.emotion.name}/${s.emotion.tone === "bright" ? "밝음" : "어두움"})` : ""}`)
    .join(", ");
}
