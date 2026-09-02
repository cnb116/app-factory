"use client";

import { useState } from "react";
import {
  Campaign,
  CampaignGroup,
  ChannelType,
  ITEM_CATEGORY_OPTIONS,
  PersonaOption,
} from "@/lib/types";
import { saveCampaigns, saveGroup } from "@/lib/storage";

const CHANNEL_OPTIONS: { value: ChannelType; label: string; hint: string }[] = [
  { value: "CAFE", label: "네이버 카페", hint: "게시글·댓글 중심" },
  { value: "BAND", label: "밴드", hint: "멤버 친밀도 중심" },
  { value: "OPENCHAT", label: "오픈채팅", hint: "실시간 대화 중심" },
];

interface ChannelDraft {
  name: string;
  url: string;
  character: string;
}

const EMPTY_DRAFT: ChannelDraft = { name: "", url: "", character: "" };

// Wizard steps: 0 channel select, 1 per-channel info loop, 2 persona, 3 nickname, 4 item category
const TOTAL_STEPS = 5;

export default function Onboarding({
  onCreated,
}: {
  onCreated: (group: CampaignGroup, campaigns: Campaign[]) => void;
}) {
  const [step, setStep] = useState(0);

  const [selectedChannels, setSelectedChannels] = useState<ChannelType[]>([]);
  const [channelDrafts, setChannelDrafts] = useState<Record<string, ChannelDraft>>({});
  const [channelSubIndex, setChannelSubIndex] = useState(0);

  const [personaOptions, setPersonaOptions] = useState<PersonaOption[] | null>(null);
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(false);
  const [personaRole, setPersonaRole] = useState("");
  const [personaTone, setPersonaTone] = useState("");
  const [showPersonaEdit, setShowPersonaEdit] = useState(false);

  const [nickname, setNickname] = useState("");

  const [itemCategory, setItemCategory] = useState<string | null>(null);
  const [itemSupplement, setItemSupplement] = useState("");

  const toggleChannel = (value: ChannelType) => {
    setSelectedChannels((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const currentChannel = selectedChannels[channelSubIndex];
  const currentDraft = channelDrafts[currentChannel] ?? EMPTY_DRAFT;

  const updateCurrentDraft = (patch: Partial<ChannelDraft>) => {
    setChannelDrafts((prev) => ({
      ...prev,
      [currentChannel]: { ...(prev[currentChannel] ?? EMPTY_DRAFT), ...patch },
    }));
  };

  const fetchPersonaOptions = async (basisCharacter: string) => {
    setIsLoadingPersonas(true);
    setPersonaOptions(null);
    try {
      const response = await fetch("/api/generate-persona-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_type: selectedChannels[0],
          community_character: basisCharacter,
        }),
      });
      const data = await response.json();
      setPersonaOptions(Array.isArray(data.personas) ? data.personas : []);
    } catch {
      setPersonaOptions([]);
    } finally {
      setIsLoadingPersonas(false);
    }
  };

  const selectPersona = (option: PersonaOption) => {
    setPersonaRole(option.role);
    setPersonaTone(option.tone);
    setShowPersonaEdit(false);
  };

  const selectedCategory = ITEM_CATEGORY_OPTIONS.find((c) => c.value === itemCategory);
  const needsSupplement = itemCategory === "ETC";

  const step0Valid = selectedChannels.length > 0;
  const channelStepValid = currentDraft.name.trim() !== "" && currentDraft.url.trim() !== "" && currentDraft.character.trim() !== "";
  const step2Valid = personaRole.trim() !== "" && personaTone.trim() !== "";
  const step3Valid = nickname.trim() !== "";
  const step4Valid = itemCategory !== null && (!needsSupplement || itemSupplement.trim() !== "");

  const goNextFromChannelStep = () => {
    if (channelSubIndex < selectedChannels.length - 1) {
      setChannelSubIndex((i) => i + 1);
      return;
    }
    // last channel filled — move to persona, based on the first channel's character
    setStep(2);
    void fetchPersonaOptions(channelDrafts[selectedChannels[0]]?.character ?? currentDraft.character);
  };

  const goPrevFromChannelStep = () => {
    if (channelSubIndex > 0) {
      setChannelSubIndex((i) => i - 1);
      return;
    }
    setStep(0);
  };

  const handleSubmit = () => {
    if (!selectedCategory || selectedChannels.length === 0) return;

    const item_description = needsSupplement
      ? itemSupplement.trim()
      : `${selectedCategory.label}${itemSupplement.trim() ? ` — ${itemSupplement.trim()}` : ""}`;

    const group: CampaignGroup = {
      id: crypto.randomUUID(),
      nickname: nickname.trim(),
      item_description,
      persona_role: personaRole.trim(),
      persona_tone: personaTone.trim(),
      created_at: new Date().toISOString(),
    };

    const campaigns: Campaign[] = selectedChannels.map((channelType) => {
      const draft = channelDrafts[channelType] ?? EMPTY_DRAFT;
      return {
        id: crypto.randomUUID(),
        group_id: group.id,
        title: draft.name.trim(),
        item_description,
        channel_type: channelType,
        channel_url: draft.url.trim(),
        community_character: draft.character.trim(),
        nickname: group.nickname,
        persona_role: group.persona_role,
        persona_tone: group.persona_tone,
        current_day: 1,
        status: "ACTIVE",
        current_streak: 0,
        longest_streak: 0,
        created_at: group.created_at,
      };
    });

    saveGroup(group);
    saveCampaigns(campaigns);
    onCreated(group, campaigns);
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 py-10 sm:px-8">
      <div className="flex w-full max-w-xl flex-col gap-6">
        <h1 className="text-center text-2xl font-extrabold text-black sm:text-3xl">
          마케팅 페이스메이커
        </h1>
        <p className="text-center text-lg text-zinc-500">
          단계 {step + 1} / {TOTAL_STEPS}
        </p>

        {step === 0 && (
          <div className="flex flex-col gap-4">
            <label className="text-lg font-bold text-black">
              어떤 커뮤니티에서 시작할까요? (여러 개 선택 가능)
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CHANNEL_OPTIONS.map((opt) => {
                const selected = selectedChannels.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleChannel(opt.value)}
                    className={`flex min-h-14 flex-col items-center justify-center rounded-xl border-2 px-2 py-3 text-center transition ${
                      selected
                        ? "border-black bg-black text-yellow-400"
                        : "border-zinc-300 bg-white text-black"
                    }`}
                  >
                    <span className="text-lg font-bold">
                      {selected ? "✓ " : ""}
                      {opt.label}
                    </span>
                    <span className="text-sm opacity-80">{opt.hint}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-zinc-500">
              동시에 운영할 채널을 모두 선택하세요. 하나만 골라도 됩니다.
            </p>
            <button
              type="button"
              onClick={() => {
                setChannelSubIndex(0);
                setStep(1);
              }}
              disabled={!step0Valid}
              className="min-h-14 w-full rounded-2xl bg-black py-4 text-xl font-extrabold text-yellow-400 shadow-lg transition active:scale-95 disabled:opacity-40"
            >
              다음
            </button>
          </div>
        )}

        {step === 1 && currentChannel && (
          <div className="flex flex-col gap-4">
            <p className="text-base font-bold text-zinc-500">
              채널 정보 입력 ({channelSubIndex + 1} / {selectedChannels.length}) ·{" "}
              {CHANNEL_OPTIONS.find((c) => c.value === currentChannel)?.label}
            </p>

            <div className="flex flex-col gap-2">
              <label className="text-lg font-bold text-black">
                커뮤니티 이름 (예: OO맘카페)
              </label>
              <input
                value={currentDraft.name}
                onChange={(e) => updateCurrentDraft({ name: e.target.value })}
                placeholder="커뮤니티 이름을 입력하세요"
                className="min-h-14 w-full rounded-xl border-2 border-black px-4 text-lg text-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-lg font-bold text-black">커뮤니티 링크</label>
              <input
                value={currentDraft.url}
                onChange={(e) => updateCurrentDraft({ url: e.target.value })}
                placeholder="https://..."
                className="min-h-14 w-full rounded-xl border-2 border-black px-4 text-lg text-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-lg font-bold text-black">커뮤니티 성격</label>
              <textarea
                value={currentDraft.character}
                onChange={(e) => updateCurrentDraft({ character: e.target.value })}
                placeholder="예: 30~40대 육아맘 위주, 정보 공유가 활발하고 다정한 분위기"
                className="min-h-24 w-full rounded-xl border-2 border-black p-4 text-lg text-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
              />
              {channelSubIndex === selectedChannels.length - 1 && (
                <p className="text-sm text-zinc-500">
                  다음 단계에서 이 정보를 바탕으로 AI가 어울리는 페르소나를 추천해드려요
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={goPrevFromChannelStep}
                className="min-h-14 w-1/3 rounded-2xl border-2 border-black py-4 text-lg font-bold text-black transition active:scale-95"
              >
                이전
              </button>
              <button
                type="button"
                onClick={goNextFromChannelStep}
                disabled={!channelStepValid}
                className="min-h-14 w-2/3 rounded-2xl bg-black py-4 text-xl font-extrabold text-yellow-400 shadow-lg transition active:scale-95 disabled:opacity-40"
              >
                {channelSubIndex < selectedChannels.length - 1 ? "다음 채널" : "다음"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <label className="text-lg font-bold text-black">
              여러 채널에 공통으로 쓸 페르소나는 어떤 게 좋을까요?
            </label>
            <p className="text-base text-zinc-500">
              AI가 추천한 페르소나 중 하나를 탭 하나로 선택하세요. 모든 채널에 동일하게 적용돼요.
            </p>

            {isLoadingPersonas && (
              <p className="py-6 text-center text-lg text-zinc-500">
                어울리는 페르소나를 찾는 중...
              </p>
            )}

            {!isLoadingPersonas && personaOptions && personaOptions.length > 0 && (
              <div className="flex flex-col gap-3">
                {personaOptions.map((opt) => (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => selectPersona(opt)}
                    className={`min-h-14 w-full rounded-xl border-2 px-4 py-3 text-left transition ${
                      personaRole === opt.role
                        ? "border-black bg-black text-yellow-400"
                        : "border-zinc-300 bg-white text-black"
                    }`}
                  >
                    <span className="text-lg font-bold">[{opt.role}]</span>
                    <span className="ml-2 text-base opacity-80">{opt.tone}</span>
                  </button>
                ))}
              </div>
            )}

            {!isLoadingPersonas && personaOptions && personaOptions.length === 0 && (
              <p className="text-base text-zinc-500">
                추천을 불러오지 못했어요. 아래에서 직접 입력해주세요.
              </p>
            )}

            {!isLoadingPersonas && (
              <button
                type="button"
                onClick={() => setShowPersonaEdit((v) => !v)}
                className="text-base font-bold text-zinc-500 underline"
              >
                {showPersonaEdit ? "직접 입력 닫기" : "직접 입력하거나 살짝 수정하기"}
              </button>
            )}

            {showPersonaEdit && (
              <div className="flex flex-col gap-2 rounded-xl border-2 border-zinc-300 p-4">
                <label className="text-base font-bold text-black">역할 (예: 워킹맘)</label>
                <input
                  value={personaRole}
                  onChange={(e) => setPersonaRole(e.target.value)}
                  className="min-h-14 w-full rounded-xl border-2 border-black px-4 text-lg text-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
                />
                <label className="text-base font-bold text-black">말투</label>
                <input
                  value={personaTone}
                  onChange={(e) => setPersonaTone(e.target.value)}
                  className="min-h-14 w-full rounded-xl border-2 border-black px-4 text-lg text-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
                />
              </div>
            )}

            {!showPersonaEdit && personaRole && (
              <p className="text-base text-zinc-700">
                선택됨: <span className="font-bold">[{personaRole}]</span> {personaTone}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setChannelSubIndex(selectedChannels.length - 1);
                  setStep(1);
                }}
                className="min-h-14 w-1/3 rounded-2xl border-2 border-black py-4 text-lg font-bold text-black transition active:scale-95"
              >
                이전
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!step2Valid}
                className="min-h-14 w-2/3 rounded-2xl bg-black py-4 text-xl font-extrabold text-yellow-400 shadow-lg transition active:scale-95 disabled:opacity-40"
              >
                다음
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <label className="text-lg font-bold text-black">활동 닉네임</label>
            <p className="text-sm text-zinc-500">모든 채널에 공통으로 사용돼요</p>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="커뮤니티에서 쓸 닉네임"
              className="min-h-14 w-full rounded-xl border-2 border-black px-4 text-lg text-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-14 w-1/3 rounded-2xl border-2 border-black py-4 text-lg font-bold text-black transition active:scale-95"
              >
                이전
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!step3Valid}
                className="min-h-14 w-2/3 rounded-2xl bg-black py-4 text-xl font-extrabold text-yellow-400 shadow-lg transition active:scale-95 disabled:opacity-40"
              >
                다음
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <label className="text-lg font-bold text-black">
              당신의 서비스는 어떤 문제를 해결하나요?
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ITEM_CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setItemCategory(opt.value)}
                  className={`flex min-h-14 flex-col items-start justify-center rounded-xl border-2 px-4 py-3 text-left transition ${
                    itemCategory === opt.value
                      ? "border-black bg-black text-yellow-400"
                      : "border-zinc-300 bg-white text-black"
                  }`}
                >
                  <span className="text-lg font-bold">{opt.label}</span>
                  <span className="text-sm opacity-80">{opt.hint}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-lg font-bold text-black">
                한 줄로 보완하기 {needsSupplement ? "(필수)" : "(선택)"}
              </label>
              <input
                value={itemSupplement}
                onChange={(e) => setItemSupplement(e.target.value)}
                placeholder="예: 수제 반찬 정기 배송 서비스"
                className="min-h-14 w-full rounded-xl border-2 border-black px-4 text-lg text-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="min-h-14 w-1/3 rounded-2xl border-2 border-black py-4 text-lg font-bold text-black transition active:scale-95"
              >
                이전
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!step4Valid}
                className="min-h-14 w-2/3 rounded-2xl bg-yellow-400 py-4 text-xl font-extrabold text-black shadow-lg transition active:scale-95 disabled:opacity-40"
              >
                14일 침투 플랜 시작하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
