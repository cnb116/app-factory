export type ScenarioPhase =
  | "가입인사"
  | "눈도장"
  | "화두 던지기"
  | "일상공유"
  | "신뢰획득"
  | "미끼투척"
  | "회수/클로징";

export interface ScenarioDay {
  day: number;
  phase: ScenarioPhase;
  title: string;
  instruction: string;
}

const SCENARIO: Omit<ScenarioDay, "day">[] = [
  {
    phase: "가입인사",
    title: "가입 인사 남기기",
    instruction:
      "커뮤니티에 처음 가입했다는 인사를 남기세요. 닉네임과 간단한 자기소개, 이 커뮤니티에 관심을 갖게 된 이유를 한두 문장으로 적으면 충분합니다. 판매·홍보 느낌은 절대 금지.",
  },
  {
    phase: "눈도장",
    title: "인기글에 진심 댓글 달기",
    instruction:
      "최근 인기 있는 게시글 1~2개를 찾아 진심이 담긴 댓글을 남기세요. 형식적인 댓글보다 실제로 도움이 됐던 구체적인 이유를 적어보세요.",
  },
  {
    phase: "눈도장",
    title: "질문 글에 답변 달기",
    instruction:
      "다른 회원이 올린 질문 글을 찾아 아는 만큼 성의껏 답변해보세요. 완벽하지 않아도 됩니다, 도움을 주려는 태도가 중요합니다.",
  },
  {
    phase: "화두 던지기",
    title: "가벼운 질문 글 올리기",
    instruction:
      "커뮤니티 성격에 맞는 가벼운 질문이나 고민을 글로 올려보세요. 답을 얻으려는 목적보다 자연스러운 대화를 여는 게 목적입니다.",
  },
  {
    phase: "화두 던지기",
    title: "공감형 정보 글 올리기",
    instruction:
      "회원들이 공감할 만한 팁이나 정보를 짧게 공유하는 글을 올려보세요. 아이템과 직접 연결짓지 말고, 순수하게 도움이 되는 내용으로 구성하세요.",
  },
  {
    phase: "화두 던지기",
    title: "댓글 소통 이어가기",
    instruction:
      "이전에 올린 글에 달린 댓글에 성실히 답글을 달고, 다른 회원 글에도 댓글을 2개 이상 남겨 소통을 이어가세요.",
  },
  {
    phase: "일상공유",
    title: "일상 후기·경험담 올리기",
    instruction:
      "커뮤니티 주제와 관련된 나의 일상이나 경험담을 자연스럽게 공유해보세요. 사람 냄새 나는 진짜 이야기를 텍스트로 풀어보세요.",
  },
  {
    phase: "일상공유",
    title: "다른 회원과 스몰토크",
    instruction:
      "친해진 회원의 글에 가볍게 안부를 묻거나 스몰토크를 시도해보세요. 댓글창을 넘어 쪽지·1:1 대화로 이어져도 좋습니다.",
  },
  {
    phase: "일상공유",
    title: "고민 상담 글 올리기",
    instruction:
      "아이템 주제와 살짝 연결되는 개인적인 고민을 진솔하게 나눠보세요. 아직 아이템은 언급하지 마세요, 공감대만 쌓는 단계입니다.",
  },
  {
    phase: "신뢰획득",
    title: "경험 기반 조언 글 올리기",
    instruction:
      "관련 주제에 대해 내가 겪은 시행착오와 배운 점을 정리해서 공유해보세요. 가르치기보다 '저도 이렇게 해봤어요' 톤을 유지하세요.",
  },
  {
    phase: "신뢰획득",
    title: "회원 질문에 깊이 있는 답변",
    instruction:
      "관련 질문 글을 찾아 이전보다 더 구체적이고 도움이 되는 답변을 남겨 신뢰를 쌓아보세요.",
  },
  {
    phase: "신뢰획득",
    title: "비교·후기형 정보 공유",
    instruction:
      "관련 제품이나 방법을 비교하는 정보성 글을 올려보세요. 아직 내 아이템은 언급하지 않고, 객관적인 정보 제공자 이미지를 강화하세요.",
  },
  {
    phase: "신뢰획득",
    title: "친밀 회원과의 소통 심화",
    instruction:
      "그동안 소통해온 회원들과의 대화를 더 깊게 이어가세요. 쪽지나 댓글로 개인적인 친밀감을 쌓는 데 집중하세요.",
  },
  {
    phase: "미끼투척",
    title: "자연스럽게 아이템 언급하기",
    instruction:
      "그동안 쌓아온 신뢰를 바탕으로, 관련 대화 중 자연스럽게 내 아이템을 살짝 언급해보세요. 판매 느낌보다 '저도 이런 거 써봤는데' 톤으로 가볍게 던지세요.",
  },
];

const CLOSING_VARIANTS: Omit<ScenarioDay, "day" | "phase">[] = [
  {
    title: "관심 보인 회원에게 자세히 안내",
    instruction:
      "아이템에 관심을 보인 회원에게 쪽지나 댓글로 자세한 정보를 안내해보세요. 부담스럽지 않게, 궁금한 점 위주로 답하는 톤을 유지하세요.",
  },
  {
    title: "후기·성과 공유로 신뢰 강화",
    instruction: "아이템 관련 후기나 성과를 자연스럽게 공유해 신뢰를 한 번 더 다져보세요.",
  },
  {
    title: "관심 회원 클로징 제안",
    instruction:
      "충분히 관심을 보인 회원에게는 구체적인 다음 단계(구매·신청 등)를 자연스럽게 제안해보세요.",
  },
];

export const TOTAL_TIMELINE_DAYS = SCENARIO.length;

export function getScenarioDay(day: number): ScenarioDay {
  const safeDay = Math.max(1, Math.floor(day));
  if (safeDay <= SCENARIO.length) {
    return { day: safeDay, ...SCENARIO[safeDay - 1] };
  }
  const variant = CLOSING_VARIANTS[(safeDay - SCENARIO.length - 1) % CLOSING_VARIANTS.length];
  return { day: safeDay, phase: "회수/클로징", ...variant };
}

export function getTimeline(): ScenarioDay[] {
  return SCENARIO.map((s, i) => ({ day: i + 1, ...s }));
}
