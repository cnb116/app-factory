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

export function buildFallbackKeyword(url: URL): string {
  const hostParts = url.hostname.replace(/^www\./, "").split(".");
  const domainName = hostParts.length > 2 ? hostParts.slice(0, -2).join(".") : hostParts[0];

  const pathWords = decodeURIComponent(url.pathname)
    .split(/[/\-_.]+/)
    .filter((w) => w && !/^\d+$/.test(w));

  const searchWords = decodeURIComponent(url.search)
    .replace(/^\?/, "")
    .split(/[=&]+/)
    .filter((w) => w && !/^\d+$/.test(w));

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
