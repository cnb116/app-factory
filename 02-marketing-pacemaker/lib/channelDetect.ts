import { ChannelType } from "./types";

export function normalizeUrl(input: string): string {
  return /^https?:\/\//i.test(input) ? input : `https://${input}`;
}

export function detectChannelType(url: string): ChannelType | null {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }

  if (hostname.endsWith("cafe.naver.com")) return "CAFE";
  if (hostname.endsWith("band.us")) return "BAND";
  if (hostname.endsWith("open.kakao.com") || hostname.endsWith("kakao.com")) return "OPENCHAT";
  return null;
}
