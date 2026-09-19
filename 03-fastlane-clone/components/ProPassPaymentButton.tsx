"use client";

import { useState } from "react";
import PremiumCapsule from "./PremiumCapsule";
import { buildProPassOrderId, getTossPayments } from "@/lib/toss";

const PRO_PASS_AMOUNT = 9900;
const PRO_PASS_ORDER_NAME = "[App Factory 03호기] 프로 패스 구독";

export default function ProPassPaymentButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const tossPayments = await getTossPayments();
      await tossPayments.requestPayment("카드", {
        amount: PRO_PASS_AMOUNT,
        orderId: buildProPassOrderId(),
        orderName: PRO_PASS_ORDER_NAME,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== "USER_CANCEL") {
        console.error("[ProPassPaymentButton] 결제창 호출 실패", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PremiumCapsule
      description="03호기 프로 패스 (대본 10종 무제한 + 3대 채널 배포 패키징)"
      price="월 9,900원"
      subtext="1인 창업자·개발자를 위한 무제한 숏폼 마케팅 엔진"
      onClick={handleClick}
      disabled={isLoading}
      isLoading={isLoading}
      loadingText="결제창 여는 중..."
    />
  );
}
