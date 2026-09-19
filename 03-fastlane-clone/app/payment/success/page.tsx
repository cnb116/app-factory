import Link from "next/link";

// 심사 캡처용 테스트 연동 — 서버 결제 승인 로직은 이번 범위 밖(운영 전환 시 별도 구현).
export default function PaymentSuccessPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-white px-5 text-center">
      <p className="text-3xl">✅</p>
      <h1 className="text-xl font-black text-black">테스트 결제가 완료됐습니다</h1>
      <p className="text-base text-zinc-600">
        실제 승인·구독 활성화 로직은 아직 연동 전입니다 (테스트 키 연동 단계).
      </p>
      <Link href="/" className="mt-2 text-sm font-bold text-black underline">
        ← 홈으로 돌아가기
      </Link>
    </main>
  );
}
