export function openKakaoOpenChat(): void {
  const url = process.env.NEXT_PUBLIC_KAKAO_OPENCHAT_URL;
  if (url && url.trim() !== "") {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    alert("오픈채팅 링크가 아직 연결되지 않았습니다. 관리자에게 문의해주세요.");
  }
}
