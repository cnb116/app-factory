'use client';

import { useState } from 'react';

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

            {modalType === 'refund' ? (
              <div className="text-xs space-y-3 leading-relaxed text-slate-300">
                <p><strong>1. 서비스 성격</strong><br />본 서비스는 AI를 활용하여 영상 대본 및 플랫폼별 마케팅 메타데이터를 즉시 생성·제공하는 디지털 무형 콘텐츠입니다.</p>
                <p><strong>2. 제공 시기</strong><br />결제 완료와 동시에 시스템에서 즉시 콘텐츠 생성이 개시되며, 대본 및 메타데이터 출력이 완료된 시점에 서비스 제공이 완료됩니다.</p>
                <p><strong>3. 취소 및 환불 기준</strong><br />- 시스템 장애 등으로 인해 콘텐츠가 정상적으로 생성 및 제공되지 않은 경우 전액 환불 처리됩니다.<br />- 디지털 콘텐츠 특성상, 결제 완료 후 대본 및 결과물이 화면에 정상 출력된 이후에는 단순 변심으로 인한 환불이 불가합니다 (전자상거래 등에서의 소비자보호에 관한 법률 준수).</p>
                <p><strong>4. 환불 문의</strong><br />고객센터(010-5051-7769) 또는 이메일(family11684@gmail.com)로 접수해 주시면 영업일 기준 3일 이내에 처리됩니다.</p>
              </div>
            ) : (
              <div className="text-xs space-y-3 leading-relaxed text-slate-300">
                <p><strong>제1조 (목적)</strong><br />본 약관은 공구리닷컴(이하 "회사")이 운영하는 웹사이트(이하 "서비스")에서 제공하는 AI 기반 콘텐츠 생성 서비스의 이용조건 및 절차, 회사와 회원의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
                <p><strong>제2조 (서비스의 제공 및 변경)</strong><br />1. 회사는 이용자에게 웹 기반 AI 숏폼 영상 대본 생성 및 플랫폼별 메타데이터 패키징 서비스를 제공합니다.<br />2. 회사는 기술적 사양의 변경이나 운영상의 필요에 따라 제공할 서비스의 내용을 변경할 수 있으며, 이 경우 사전에 공지합니다.</p>
                <p><strong>제3조 (이용자의 의무)</strong><br />이용자는 관계 법령, 본 약관의 규정, 이용안내 및 주의사항을 준수하여야 하며, 서비스를 이용하여 생성된 결과물을 불법적인 용도로 사용하거나 타인의 권리를 침해하여서는 안 됩니다.</p>
                <p><strong>제4조 (지식재산권)</strong><br />본 서비스 시스템 및 소프트웨어의 저작권은 회사에 귀속되며, 서비스를 통해 생성된 최종 콘텐츠의 활용 권한은 적법하게 결제를 완료한 이용자에게 부여됩니다.</p>
                <p><strong>제5조 (면책조항)</strong><br />회사는 천재지변, 외부 AI 엔진 장애 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</p>
              </div>
            )}

            <div className="pt-2 text-right">
              <button onClick={closeModal} className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded-lg font-semibold">닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
