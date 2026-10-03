// 생성된 해시태그·SEO 태그에서 앱 내부 분류명(훅 스타일·감정 이름)이 새어 나가지 않게 걸러낸다.
// (프롬프트에 칸 배정으로 스타일·감정 이름을 명시하다 보니 "#넓은감정", "#타겟저격", "#질문" 같은 태그가 섞여 나왔다)
import { ScriptCard } from "./types";
import { BRIGHT_EMOTIONS, DARK_EMOTIONS, HOOK_STRUCTURES, getHookTypeName } from "./slotPlan";

function normalizeTag(tag: string): string {
  return tag.replace(/#/g, "").replace(/\s+/g, "").toLowerCase();
}

const STYLE_NAMES = HOOK_STRUCTURES.map(getHookTypeName);

// 포함 일치로 지우는 키워드: 스타일 이름에서 "형"과 공백을 뺀 복합어(예: "넓은감정", "타겟저격", "질문도발")
// + 실제로 노출된 축약 변형 + 짧지만 지시서에서 포함 일치로 지정한 단어.
export const STYLE_TAG_CONTAINS_KEYWORDS: string[] = Array.from(
  new Set([
    ...STYLE_NAMES.map((name) => normalizeTag(name.replace(/형$/, ""))),
    "실패공감", // "실패담 공감형"이 줄여서 노출된 형태
    "경고",
  ])
);

// 정확히 일치할 때만 지우는 키워드: 감정 이름 9종 + 스타일 이름을 이루는 각 단어("형" 제외).
// 실제로 "#질문", "#반전", "#고백", "#해결"처럼 스타일 이름의 한 단어만 단독 태그로 노출됐다.
// 포함 일치로 하면 "#여유로운주말", "#자주묻는질문", "#취향저격" 같은 정상 태그까지 사라지므로 정확 일치로만 비교한다.
export const INTERNAL_TAG_EXACT_KEYWORDS: string[] = Array.from(
  new Set([
    ...[...DARK_EMOTIONS, ...BRIGHT_EMOTIONS].map((e) => normalizeTag(e.name)),
    ...STYLE_NAMES.flatMap((name) =>
      name
        .replace(/형$/, "")
        .split(/\s+/)
        .filter(Boolean)
        .map(normalizeTag)
    ),
  ])
);

export function isInternalLabelTag(tag: string): boolean {
  const t = normalizeTag(tag);
  if (t === "") return true; // 빈 태그는 남겨 두지 않는다
  if (INTERNAL_TAG_EXACT_KEYWORDS.includes(t)) return true;
  return STYLE_TAG_CONTAINS_KEYWORDS.some((k) => t.includes(k));
}

function filterTags(tags: string[] | undefined, removed: string[]): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter((tag) => {
    if (typeof tag !== "string") return false;
    if (isInternalLabelTag(tag)) {
      if (tag.trim() !== "") removed.push(tag.trim());
      return false;
    }
    return true;
  });
}

// 캡션 해시태그와 플랫폼별 SEO 태그 4곳 모두에서 내부 분류명 태그를 지우고, 남은 태그만 그대로 둔다.
export function stripInternalLabelTags(card: ScriptCard): { card: ScriptCard; removed: string[] } {
  const removed: string[] = [];
  const next: ScriptCard = {
    ...card,
    hashtags: filterTags(card.hashtags, removed),
    youtubeSeo: { ...card.youtubeSeo, tags: filterTags(card.youtubeSeo?.tags, removed) },
    instagramSeo: { ...card.instagramSeo, hashtags: filterTags(card.instagramSeo?.hashtags, removed) },
    tiktokSeo: { ...card.tiktokSeo, hashtags: filterTags(card.tiktokSeo?.hashtags, removed) },
  };
  return { card: next, removed };
}

export function countTags(card: ScriptCard): number {
  return (
    (card.hashtags?.length ?? 0) +
    (card.youtubeSeo?.tags?.length ?? 0) +
    (card.instagramSeo?.hashtags?.length ?? 0) +
    (card.tiktokSeo?.hashtags?.length ?? 0)
  );
}
