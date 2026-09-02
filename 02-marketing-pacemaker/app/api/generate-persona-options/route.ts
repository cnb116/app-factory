import { NextRequest, NextResponse } from "next/server";
import { getGeminiApiKey } from "@/lib/gemini";
import { CHANNEL_LABEL, ChannelType, PersonaOption } from "@/lib/types";

interface RequestBody {
  channel_type: ChannelType;
  community_character: string;
}

const FALLBACK_PERSONAS: PersonaOption[] = [
  { role: "관심 많은 초보", tone: "궁금한 게 많고 솔직담백한 말투" },
  { role: "정보통 회원", tone: "차분하고 요점 정리를 잘하는 말투" },
  { role: "친근한 이웃", tone: "다정하고 편하게 말 거는 말투" },
];

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function POST(request: NextRequest) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  let body: Partial<RequestBody>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { channel_type, community_character } = body;

  if (!channel_type || !community_character || community_character.trim() === "") {
    return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
  }

  const channelLabel = CHANNEL_LABEL[channel_type] ?? channel_type;

  const prompt = `${channelLabel} 커뮤니티가 있고, 그 성격은 다음과 같다: "${community_character}"

이 커뮤니티에 자연스럽게 녹아들 수 있는, 이 커뮤니티에서 흔히 볼 수 있는 회원 페르소나 3~4개를 추천해줘.
각 페르소나는 2~6자의 짧은 역할명(role)과, 그 페르소나가 실제로 글을 쓸 때 쓸 법한 말투를 한 문장으로 설명(tone)해서 제시해줘.

다른 설명 없이 아래 형식의 JSON 배열만 출력해:
[{"role": "역할명", "tone": "말투 설명"}, ...]`;

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
      return NextResponse.json({ personas: FALLBACK_PERSONAS });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string") {
      return NextResponse.json({ personas: FALLBACK_PERSONAS });
    }

    const parsed = extractJson(text);
    if (
      !Array.isArray(parsed) ||
      parsed.length === 0 ||
      !parsed.every(
        (p) =>
          p &&
          typeof p === "object" &&
          typeof (p as PersonaOption).role === "string" &&
          typeof (p as PersonaOption).tone === "string"
      )
    ) {
      return NextResponse.json({ personas: FALLBACK_PERSONAS });
    }

    return NextResponse.json({ personas: (parsed as PersonaOption[]).slice(0, 4) });
  } catch {
    return NextResponse.json({ personas: FALLBACK_PERSONAS });
  }
}
