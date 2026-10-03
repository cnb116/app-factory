export interface ContentAnalysis {
  targetAudience: string;
  painPoints: string[];
  coreOffer: string;
  summary: string;
}

export interface YoutubeSeoMeta {
  seoTitle: string;
  seoDescription: string;
  tags: string[];
}

export interface InstagramSeoMeta {
  firstLine: string;
  body: string;
  hashtags: string[];
}

export interface TiktokSeoMeta {
  seoCaption: string;
  hashtags: string[];
}

export interface ScriptCard {
  id: string;
  hookType: string;
  // 넓은 감정형 카드에만 채워진다. 밝은 감정이면 2구간(painAgitation 필드)이 "고통 자극"이 아니라 "기대 키우기"로 쓰인다.
  emotion?: string;
  emotionTone?: "dark" | "bright";
  thumbnailLine1: string;
  thumbnailLine2: string;
  hookLine: string;
  hookSearchKeyword: string;
  painAgitation: string;
  painSearchKeyword: string;
  demoGuide: string;
  cta: string;
  caption: string;
  hashtags: string[];
  youtubeSeo: YoutubeSeoMeta;
  instagramSeo: InstagramSeoMeta;
  tiktokSeo: TiktokSeoMeta;
}

export interface GeneratedScripts {
  cards: ScriptCard[];
}
