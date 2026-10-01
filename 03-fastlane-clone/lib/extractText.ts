export function extractTextFromHtml(html: string): string {
  const noScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const noTags = noScripts.replace(/<[^>]+>/g, " ");

  const decoded = noTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  return decoded.replace(/\s+/g, " ").trim();
}

const BLOCKED_HOSTS = new Set(["localhost", "0.0.0.0"]);

function isPrivateHost(hostname: string): boolean {
  if (BLOCKED_HOSTS.has(hostname)) return true;
  if (hostname.endsWith(".local")) return true;
  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
  }
  return false;
}

export function buildFallbackKeyword(url: URL, options: { includeSearch?: boolean } = {}): string {
  const { includeSearch = true } = options;
  const hostParts = url.hostname.replace(/^www\./, "").split(".");
  const domainName = hostParts.length > 2 ? hostParts.slice(0, -2).join(".") : hostParts[0];

  const pathWords = decodeURIComponent(url.pathname)
    .split(/[/\-_.]+/)
    .filter((w) => w && !/^\d+$/.test(w));

  // 쿠팡파트너스 같은 단축 링크는 리다이렉트 이후 최종 URL의 쿼리스트링이 트래킹 파라미터(traceid, mcid, wPcid 등
  // 의미 없는 긴 해시값)로 가득 차 있어, 그대로 키워드에 섞으면 오히려 Gemini가 엉뚱하게 추론할 노이즈가 된다.
  // 이런 경우 호출부에서 includeSearch: false로 넘겨 쿼리스트링은 아예 배제한다.
  const searchWords = includeSearch
    ? decodeURIComponent(url.search)
        .replace(/^\?/, "")
        .split(/[=&]+/)
        .filter((w) => w && !/^\d+$/.test(w))
    : [];

  return [domainName, ...pathWords, ...searchWords].join(" ").trim();
}

// 네이버 블로그 PC 버전(blog.naver.com)은 프레임셋 구조라 최상위 HTML에 실제 본문이 없고(2~3KB짜리 빈 프레임 스켈레톤),
// 진짜 글 내용은 모바일 버전(m.blog.naver.com)에 그대로 렌더링되어 있다. 크롤링 대상 URL만 모바일로 바꿔치기한다
// (사용자에게 보여주는 sourceUrl은 원본 그대로 유지 — 이 함수는 fetch용으로만 쓴다).
export function buildCrawlTargetUrl(url: URL): string {
  if (url.hostname === "blog.naver.com" || url.hostname === "www.blog.naver.com") {
    const mobileUrl = new URL(url.toString());
    mobileUrl.hostname = "m.blog.naver.com";
    return mobileUrl.toString();
  }
  return url.toString();
}

// 네이버 블로그 "홈/목록" 주소(예: blog.naver.com/balancedlife10)는 모바일 버전으로 우회해도 해결이 안 되는
// 별도 문제다 — 최신 글 목록 자체가 완전히 클라이언트 JS가 별도 API로 불러오는 SPA 구조라, 정적 HTML에는
// 글 제목·본문이 전혀 없고(실측: __NEXT류 initialState 스크립트에도 글 목록 데이터 없음) 블로그 제목·
// 프로필 소개글·메뉴 버튼 텍스트만 남는다. 이걸 그대로 Gemini에 넘기면 프로필 소개글을 "오늘의 주제"로
// 오인해 완전히 엉뚱한 내용을 만들어낸다. 코드로 우회할 방법이 없으므로(링크·logNo 정보 자체가 HTML에 없음),
// 크롤링을 시도하기 전에 URL 구조로 먼저 걸러 사용자에게 개별 글 URL을 입력하도록 안내한다.
export function isNaverBlogListUrl(url: URL): boolean {
  const isNaverBlogHost = ["blog.naver.com", "www.blog.naver.com", "m.blog.naver.com"].includes(url.hostname);
  if (!isNaverBlogHost) return false;

  // PostView.naver?blogId=...&logNo=... 형식(레거시 개별 글 URL)은 쿼리스트링에 logNo가 있다 — 제외.
  if (url.searchParams.has("logNo")) return false;

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return true; // blog.naver.com 자체(완전 홈)

  // 개별 글 URL은 .../{블로그아이디}/{글번호(logNo, 순수 숫자)} 형태다.
  // 글번호 세그먼트가 없으면(홈, 카테고리, 프로필 탭 등) 목록형으로 판단한다.
  const lastSegment = segments[segments.length - 1];
  const isIndividualPostUrl = segments.length >= 2 && /^\d+$/.test(lastSegment);
  return !isIndividualPostUrl;
}

export function validateCrawlUrl(rawUrl: string): URL | null {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (isPrivateHost(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}
