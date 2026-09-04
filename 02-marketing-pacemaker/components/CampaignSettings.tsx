"use client";

import { useState } from "react";
import { Campaign } from "@/lib/types";

export default function CampaignSettings({
  campaign,
  onCampaignChange,
}: {
  campaign: Campaign;
  onCampaignChange: (campaign: Campaign) => void;
}) {
  const [open, setOpen] = useState(false);
  const [itemDescription, setItemDescription] = useState(campaign.item_description ?? "");
  const [nickname, setNickname] = useState(campaign.nickname ?? "");
  const [personaRole, setPersonaRole] = useState(campaign.persona_role ?? "");
  const [personaTone, setPersonaTone] = useState(campaign.persona_tone ?? "");

  const handleSave = () => {
    onCampaignChange({
      ...campaign,
      item_description: itemDescription.trim(),
      nickname: nickname.trim(),
      persona_role: personaRole.trim(),
      persona_tone: personaTone.trim(),
    });
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start text-sm font-bold text-zinc-500 underline"
      >
        내 서비스·페르소나 설정
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-zinc-300 p-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold text-black">내 서비스 소개 (선택 입력)</label>
        <textarea
          value={itemDescription}
          onChange={(e) => setItemDescription(e.target.value)}
          placeholder="예: 수제 반찬 정기 배송 서비스"
          className="min-h-16 w-full rounded-lg border-2 border-black p-2 text-base text-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold text-black">활동 닉네임</label>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="min-h-12 w-full rounded-lg border-2 border-black px-3 text-base text-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold text-black">페르소나 역할</label>
        <input
          value={personaRole}
          onChange={(e) => setPersonaRole(e.target.value)}
          className="min-h-12 w-full rounded-lg border-2 border-black px-3 text-base text-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-bold text-black">페르소나 말투</label>
        <input
          value={personaTone}
          onChange={(e) => setPersonaTone(e.target.value)}
          className="min-h-12 w-full rounded-lg border-2 border-black px-3 text-base text-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="min-h-12 flex-1 rounded-lg border-2 border-black text-base font-bold text-black transition active:scale-95"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="min-h-12 flex-1 rounded-lg bg-black text-base font-bold text-yellow-400 transition active:scale-95"
        >
          저장
        </button>
      </div>
    </div>
  );
}
