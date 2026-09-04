import { NextRequest, NextResponse } from "next/server";
import { getGeminiApiKey } from "@/lib/gemini";
import { CHANNEL_LABEL, ChannelType } from "@/lib/types";

interface RequestBody {
  channel_type: ChannelType;
  community_character: string;
  item_description?: string;
  nickname: string;
  persona_role?: string;
  persona_tone?: string;
  day: number;
  phase: string;
  mission_title: string;
  mission_instruction: string;
}

function buildFallbackContent(missionTitle: string, missionInstruction: string): string {
  return `[자동 생성 실패 - 기본 문구입니다]\n${missionInstruction}\n\n위 가이드를 참고해서 직접 자연스럽게 작성해보세요. (미션: ${missionTitle})`;
}

export async function POST(request: NextRequest) {
  const apiKey = getGeminiApiKey();

  let body: Partial<RequestBody>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const {
    channel_type,
    community_character,
    item_description,
    nickname,
    persona_role,
    persona_tone,
    day,
    phase,
    mission_title,
    mission_instruction,
  } = body;

  if (
    !channel_type ||
    !community_character ||
    !nickname ||
    !day ||
    !phase ||
    !mission_title ||
    !mission_instruction
  ) {
    return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
  }

  if (!apiKey) {
    console.error("[generate-content] GEMINI_API_KEY is not set");
    return NextResponse.json({ content: buildFallbackContent(mission_title, mission_instruction) });
  }

  const channelLabel = CHANNEL_LABEL[channel_type as ChannelType] ?? channel_type;
  const personaLine =
    persona_role && persona_tone
      ? `\n너의 페르소나: ${persona_role} (${persona_tone})`
      : "";
  const itemLine = item_description
    ? `\n내가 나중에 자연스럽게 알리고 싶은 아이템: ${item_description}`
    : "";

  const prompt = `너는 ${channelLabel} 커뮤니티에서 활동하는 일반 회원 "${nickname}"이다.${personaLine}
이 커뮤니티의 성격: ${community_character}${itemLine}

오늘은 침투 D+${day}일차, 단계는 "${phase}", 미션은 "${mission_title}"이다.
미션 가이드: ${mission_instruction}

위 미션에 맞춰 이 커뮤니티에 그대로 복사해서 붙여넣을 수 있는 게시글 또는 댓글 텍스트를 작성해줘.
조건:
- 실제 사람이 쓴 것처럼 자연스러운 구어체, 판매/홍보 티가 나지 않게
- "미끼투척" 이전 단계에서는 아이템을 절대 직접 언급하지 말 것
- 커뮤니티 성격과 톤에 맞출 것
- 결과는 바로 붙여넣을 수 있는 본문 텍스트만 출력 (따옴표, 설명, 마크다운 없이)
- 3~6문장 이내로 짧고 자연스럽게`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[generate-content] Gemini non-OK response", response.status, errBody);
      return NextResponse.json({ content: buildFallbackContent(mission_title, mission_instruction) });
    }

    const data = await response.json();
    const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof generated !== "string" || generated.trim() === "") {
      console.error("[generate-content] no text in candidates", JSON.stringify(data));
      return NextResponse.json({ content: buildFallbackContent(mission_title, mission_instruction) });
    }

    return NextResponse.json({ content: generated.trim() });
  } catch (err) {
    console.error("[generate-content] caught exception", err);
    return NextResponse.json({ content: buildFallbackContent(mission_title, mission_instruction) });
  }
}
