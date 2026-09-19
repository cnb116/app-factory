import type { Metadata } from "next";
import Link from "next/link";
import { TermsContent } from "@/components/LegalContent";

export const metadata: Metadata = {
  title: "이용약관 | 숏폼 대본 공장",
  description: "공구리닷컴 숏폼 대본 공장 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen w-full bg-slate-950 px-4 py-12 text-slate-200">
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <h1 className="mb-6 border-b border-slate-800 pb-4 text-lg font-bold text-white">
          서비스 이용약관
        </h1>

        <TermsContent />

        <div className="mt-8 border-t border-slate-800 pt-4">
          <Link href="/" className="text-xs text-slate-500 underline hover:text-slate-300">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
