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
