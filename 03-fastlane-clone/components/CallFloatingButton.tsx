"use client";

export default function CallFloatingButton() {
  const openChatUrl = process.env.NEXT_PUBLIC_KAKAO_OPENCHAT_URL;

  const handleClick = () => {
    if (openChatUrl && openChatUrl.trim() !== "") {
      window.open(openChatUrl, "_blank", "noopener,noreferrer");
    } else {
      alert("오픈채팅 링크가 아직 연결되지 않았습니다. 관리자에게 문의해주세요.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="월 9,900원 구독형 03호기 프로 패스를 7일간 무료로 체험해보세요"
      className="fixed bottom-5 right-4 z-50 max-w-[200px] rounded-full bg-black px-5 py-4 text-left text-sm leading-tight font-bold text-yellow-400 shadow-lg transition active:scale-95 sm:max-w-none sm:text-base"
    >
      📞 김반장과 10분 상담하고
      <br />
      7일 무료 이용권 받기
    </button>
  );
}
