import { loadTossPayments, TossPaymentsInstance } from "@tosspayments/payment-sdk";

// 심사 캡처용 테스트 클라이언트 키 — 실제 승인 로직(시크릿 키, 서버 검증)은 이번 범위 밖.
// 운영 전환 시 이 키만 실제 발급받은 운영 클라이언트 키로 교체하면 된다.
const TOSS_TEST_CLIENT_KEY = "test_ck_yZqmkKeP8gazj4gPkJwOVbQRxB9l";

let tossPaymentsPromise: Promise<TossPaymentsInstance> | null = null;

export function getTossPayments(): Promise<TossPaymentsInstance> {
  if (!tossPaymentsPromise) {
    tossPaymentsPromise = loadTossPayments(TOSS_TEST_CLIENT_KEY);
  }
  return tossPaymentsPromise;
}

export function buildProPassOrderId(): string {
  return `pro-pass-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
