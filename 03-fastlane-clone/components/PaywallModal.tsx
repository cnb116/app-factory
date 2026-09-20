"use client";

import ProPassPaymentButton from "./ProPassPaymentButton";
import { openKakaoOpenChat } from "@/lib/kakao";

interface PaywallModalProps {
  onClose: () => void;
}

export default function PaywallModal({ onClose }: PaywallModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border-2 border-black bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-black text-black">1회 무료 체험 완료</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-xl font-bold text-zinc-400 transition hover:text-black"
          >
            ✕
          </button>
        </div>

        <p className="mb-6 text-base leading-relaxed text-black">
          1회 무료 체험이 완료되었습니다. 계속 무제한으로 생성하시려면 이용권을 구매하거나 김반장 상담을 신청하세요.
        </p>

        <div className="flex flex-col gap-3">
          <ProPassPaymentButton />
          <button
            type="button"
            onClick={openKakaoOpenChat}
            className="w-full rounded-xl bg-black py-4 text-base font-bold text-yellow-400 shadow-lg transition active:scale-95"
          >
            📞 김반장과 10분 상담하고 7일 무료 이용권 받기
          </button>
        </div>
      </div>
    </div>
  );
}
