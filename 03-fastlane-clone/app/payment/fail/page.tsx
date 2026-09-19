import Link from "next/link";

export default function PaymentFailPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-white px-5 text-center">
      <p className="text-3xl">⚠️</p>
      <h1 className="text-xl font-black text-black">결제가 완료되지 않았습니다</h1>
      <p className="text-base text-zinc-600">결제를 취소했거나 오류가 발생했습니다. 다시 시도해주세요.</p>
      <Link href="/" className="mt-2 text-sm font-bold text-black underline">
        ← 홈으로 돌아가기
      </Link>
    </main>
  );
}
