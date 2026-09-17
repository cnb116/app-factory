export interface ContentAnalysis {
  targetAudience: string;
  painPoints: string[];
  coreOffer: string;
  summary: string;
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
}

export interface GeneratedScripts {
  cards: ScriptCard[];
}
