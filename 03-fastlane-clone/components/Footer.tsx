'use client';

import { useState } from 'react';
import { RefundContent, TermsContent } from './LegalContent';

export default function Footer() {
  const [modalType, setModalType] = useState<'terms' | 'refund' | null>(null);

  const closeModal = () => setModalType(null);

  return (
    <>
      <footer className="w-full bg-slate-950 text-slate-400 text-xs py-8 px-4 border-t border-slate-800">
        <div className="max-w-4xl mx-auto space-y-2 leading-relaxed">
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-semibold text-slate-300">
            <span>상호명: 공구리닷컴</span>
            <span>대표자: 조재만</span>
            <span>사업자등록번호: 665-61-00939</span>
          </div>
          <div>
            <span>사업장 주소: 부산광역시 해운대구 양운로 53, 312호(좌동, 투모로우)</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>고객센터: 010-5051-7769</span>
            <span>이메일: family11684@gmail.com</span>
            <span>통신판매업신고: 신고 준비 중</span>
          </div>
          <div className="pt-2 flex gap-4 text-slate-400 font-medium">
            <button type="button" onClick={() => setModalType('terms')} className="underline hover:text-white transition-colors">이용약관</button>
            <button type="button" onClick={() => setModalType('refund')} className="underline hover:text-white transition-colors">환불정책</button>
          </div>
          <p className="text-[11px] text-slate-500 pt-2">
            © Gongguri.com. All rights reserved. 본 서비스는 인공지능 기반 디지털 콘텐츠 특성상 생성 개시 후 단순 변심에 의한 환불이 제한될 수 있습니다.
          </p>
        </div>
      </footer>

      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {modalType === 'terms' ? '서비스 이용약관' : '환불 및 서비스 제공 정책'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white text-lg font-bold px-2">✕</button>
            </div>

            {modalType === 'refund' ? <RefundContent /> : <TermsContent />}

            <div className="pt-2 flex items-center justify-between">
              <a
                href={modalType === 'refund' ? '/refund' : '/terms'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-slate-500 underline hover:text-slate-300"
              >
                새 창에서 보기 ↗
              </a>
              <button onClick={closeModal} className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded-lg font-semibold">닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
