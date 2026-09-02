"use client";

import { useState } from "react";
import { Campaign, ChannelType, CHANNEL_LABEL } from "@/lib/types";
import { saveCampaign } from "@/lib/storage";

const CHANNEL_OPTIONS: { value: ChannelType; label: string; hint: string }[] = [
  { value: "CAFE", label: "네이버 카페", hint: "게시글·댓글 중심" },
  { value: "BAND", label: "밴드", hint: "멤버 친밀도 중심" },
  { value: "OPENCHAT", label: "오픈채팅", hint: "실시간 대화 중심" },
];

export default function Onboarding({
  onCreated,
}: {
  onCreated: (campaign: Campaign) => void;
}) {
  const [channelType, setChannelType] = useState<ChannelType | null>(null);
  const [communityName, setCommunityName] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [communityCharacter, setCommunityCharacter] = useState("");
  const [nickname, setNickname] = useState("");
  const [itemDescription, setItemDescription] = useState("");

  const isValid =
    channelType !== null &&
    communityName.trim() !== "" &&
    channelUrl.trim() !== "" &&
    communityCharacter.trim() !== "" &&
    nickname.trim() !== "" &&
    itemDescription.trim() !== "";

  const handleSubmit = () => {
    if (!isValid || channelType === null) return;

    const campaign: Campaign = {
      id: crypto.randomUUID(),
      title: communityName.trim(),
      item_description: itemDescription.trim(),
      channel_type: channelType,
      channel_url: channelUrl.trim(),
      community_character: communityCharacter.trim(),
      nickname: nickname.trim(),
      current_day: 1,
      status: "ACTIVE",
      created_at: new Date().toISOString(),
    };

    saveCampaign(campaign);
    onCreated(campaign);
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 py-10 sm:px-8">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <h1 className="text-center text-2xl font-extrabold text-black sm:text-3xl">
          마케팅 페이스메이커
        </h1>
        <p className="text-center text-lg text-zinc-600">
          커뮤니티 침투 14일 플랜을 시작하기 전, 몇 가지만 알려주세요
        </p>

        <div className="flex flex-col gap-2">
          <label className="text-lg font-bold text-black">채널 유형</label>
          <div className="grid grid-cols-3 gap-2">
            {CHANNEL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setChannelType(opt.value)}
                className={`flex min-h-14 flex-col items-center justify-center rounded-xl border-2 px-2 py-3 text-center transition ${
                  channelType === opt.value
                    ? "border-black bg-black text-yellow-400"
                    : "border-zinc-300 bg-white text-black"
                }`}
              >
                <span className="text-lg font-bold">{opt.label}</span>
                <span className="text-sm opacity-80">{opt.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-lg font-bold text-black">
            커뮤니티 이름 (예: OO맘카페)
          </label>
          <input
            value={communityName}
            onChange={(e) => setCommunityName(e.target.value)}
            placeholder="커뮤니티 이름을 입력하세요"
            className="min-h-14 w-full rounded-xl border-2 border-black px-4 text-lg text-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-lg font-bold text-black">커뮤니티 링크</label>
          <input
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            placeholder="https://..."
            className="min-h-14 w-full rounded-xl border-2 border-black px-4 text-lg text-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-lg font-bold text-black">커뮤니티 성격</label>
          <textarea
            value={communityCharacter}
            onChange={(e) => setCommunityCharacter(e.target.value)}
            placeholder="예: 30~40대 육아맘 위주, 정보 공유가 활발하고 다정한 분위기"
            className="min-h-24 w-full rounded-xl border-2 border-black p-4 text-lg text-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-lg font-bold text-black">활동 닉네임</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="이 커뮤니티에서 쓸 닉네임"
            className="min-h-14 w-full rounded-xl border-2 border-black px-4 text-lg text-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-lg font-bold text-black">아이템 한 줄 소개</label>
          <input
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            placeholder="예: 수제 반찬 정기 배송 서비스"
            className="min-h-14 w-full rounded-xl border-2 border-black px-4 text-lg text-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid}
          className="min-h-14 w-full rounded-2xl bg-black py-4 text-xl font-extrabold text-yellow-400 shadow-lg transition active:scale-95 disabled:opacity-40"
        >
          14일 침투 플랜 시작하기
        </button>
      </div>
    </div>
  );
}
