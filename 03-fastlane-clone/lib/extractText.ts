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
