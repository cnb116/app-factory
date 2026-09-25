import { NextRequest, NextResponse } from "next/server";
import { getGeminiApiKey, geminiEndpoint, GEMINI_IMAGE_MODEL } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  let topic: string | undefined;
  try {
    const body = await request.json();
    topic = typeof body?.topic === "string" ? body.topic.trim() : undefined;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!topic) {
    return NextResponse.json({ error: "주제를 먼저 입력해주세요." }, { status: 400 });
  }

  const prompt = `Create a blog thumbnail illustration for the topic "${topic}".
Style: bold, minimalist, high-contrast black background with vivid yellow (#FFD400) accents — flat design, no gradients, no photorealism.
If any text appears in the image, it must be in English only — never Korean or any other language.
The image should feel modern, confident, and suitable for a Korean blog post header about this topic.`;

  console.log("[generate-image] Gemini 이미지 생성 호출 시작");
  try {
    const response = await fetch(geminiEndpoint(apiKey, GEMINI_IMAGE_MODEL), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[generate-image] Gemini 호출 실패 — non-OK response", response.status, errBody);
      return NextResponse.json(
        { error: "이미지 생성에 실패했습니다. 잠시 후 다시 시도하거나 직접 업로드를 이용해주세요." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p: { inlineData?: { mimeType?: string; data?: string } }) => p?.inlineData?.data);

    if (!imagePart?.inlineData?.data) {
      console.error("[generate-image] Gemini 응답에 이미지 데이터가 없음", JSON.stringify(data));
      return NextResponse.json({ error: "이미지를 생성하지 못했습니다." }, { status: 502 });
    }

    console.log("[generate-image] Gemini 이미지 생성 성공");
    return NextResponse.json({
      imageBase64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || "image/png",
    });
  } catch (err) {
    console.error("[generate-image] Gemini 호출 중 예외 발생(네트워크/타임아웃 등)", err);
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
