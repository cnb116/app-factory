export interface ViralFeed {
  threadPost: string;
  threadFirstComment: string;
  storySticker: string;
  reelsPinnedComment: string;
  reelsCaption: string;
  commentDmTrigger: string;
}

const BASE_URL = "https://03-fastlane-clone.vercel.app/?pass=free7day";
const UTM_COMMON = "utm_medium=organic&utm_campaign=04ho_content_factory";

// 채널별 유입 구분을 위해 매직링크에 utm_source만 다르게 붙인 3개 변형 — 공통 파라미터는 한 곳에서만 관리한다.
export const THREADS_LINK_URL = `${BASE_URL}&utm_source=threads&${UTM_COMMON}`;
export const STORY_LINK_URL = `${BASE_URL}&utm_source=story&${UTM_COMMON}`;
export const REELS_LINK_URL = `${BASE_URL}&utm_source=reels&${UTM_COMMON}`;
export const STORY_LINK_LABEL = "👉 7일 무료 이용권";
