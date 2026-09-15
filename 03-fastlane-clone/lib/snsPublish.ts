/**
 * SNS 자동 발행 2단계 확장 인터페이스 (스텁 — 실제 동작 없음)
 *
 * 현재(1단계)는 사용자가 유튜브 스튜디오/인스타 크리에이터 스튜디오/틱톡
 * 업로드 페이지로 직접 이동해 수동 업로드하는 딥링크만 제공한다
 * (`components/UploadLinkButtons.tsx` 참고).
 *
 * 2단계에서는 OAuth 인가 후 아래 채널별 API로 영상을 직접 자동 발행한다:
 * - youtube:   YouTube Data API v3 (videos.insert, resumable upload)
 * - instagram: Meta Graph API (Instagram Content Publishing API)
 * - tiktok:    TikTok Content Posting API
 *
 * 이 파일은 그 자리를 잡아두는 타입/설정 틀만 정의한다. 실제 fetch 호출,
 * 토큰 저장/갱신, 업로드 진행률 처리 등은 2단계 지시서에서 별도 구현한다.
 */

export type SnsChannel = "youtube" | "instagram" | "tiktok";

export interface SnsAuthConfig {
  /** OAuth 앱의 클라이언트 ID (예: YOUTUBE_CLIENT_ID, META_APP_ID, TIKTOK_CLIENT_KEY) */
  clientId: string;
  /** OAuth 앱의 클라이언트 시크릿 — 서버 환경변수로만 보관, 클라이언트에 노출 금지 */
  clientSecret: string;
  /** 인가 완료 후 돌아올 콜백 URL */
  redirectUri: string;
  /** 요청할 OAuth 권한 범위 */
  scopes: string[];
}

/**
 * 채널별 OAuth 설정 자리. 실제 값은 2단계 착수 시 Vercel 환경변수
 * (예: YOUTUBE_CLIENT_ID/SECRET, META_APP_ID/SECRET, TIKTOK_CLIENT_KEY/SECRET)로
 * 채워 넣는다. 지금은 미연동 상태이므로 전부 null.
 */
export const SNS_AUTH_CONFIG: Record<SnsChannel, SnsAuthConfig | null> = {
  youtube: null, // TODO(2단계): YouTube Data API v3, scope "https://www.googleapis.com/auth/youtube.upload"
  instagram: null, // TODO(2단계): Meta Graph API, scope "instagram_content_publish"
  tiktok: null, // TODO(2단계): TikTok Content Posting API, scope "video.publish"
};

export interface SnsPublishPayload {
  channel: SnsChannel;
  /** 업로드할 영상 파일 (2단계에서 실제 촬영본/편집본 연결 예정) */
  videoFile?: File | Blob;
  caption: string;
  hashtags: string[];
  thumbnailText?: string;
}

export interface SnsPublishResult {
  channel: SnsChannel;
  postUrl: string;
  publishedAt: string;
}

/**
 * TODO(2단계): 채널별 OAuth 인가 화면으로 리다이렉트하고, 콜백에서 받은
 * 코드를 액세스/리프레시 토큰으로 교환해 안전하게 저장한다.
 */
export async function startSnsAuth(channel: SnsChannel): Promise<never> {
  throw new Error(`[snsPublish] ${channel} OAuth 연동은 아직 구현되지 않았습니다 (2단계 예정)`);
}

/**
 * TODO(2단계): 인가된 토큰으로 각 채널 API에 영상을 실제로 업로드/게시한다.
 * - youtube: videos.insert (resumable upload)
 * - instagram: media 생성 -> media_publish
 * - tiktok: video/init -> video/upload -> video/publish
 */
export async function publishToSns(payload: SnsPublishPayload): Promise<SnsPublishResult> {
  throw new Error(`[snsPublish] ${payload.channel} 자동 발행은 아직 구현되지 않았습니다 (2단계 예정)`);
}
