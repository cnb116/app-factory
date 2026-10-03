// 서버에서 본문을 읽지 못해 엉뚱한 대본이 나오기 쉬운 링크(쇼핑몰 상품·지도 링크). 입력 화면에서 미리 안내만 하고 진행은 막지 않는다.
const HARD_TO_READ_HOSTS = ["coupang.com", "map.naver.com", "place.naver.com", "naver.me"];

export function isHardToReadUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed === "") return false;
  let host: string;
  try {
    host = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).hostname.toLowerCase();
  } catch {
    return false;
  }
  return HARD_TO_READ_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}
