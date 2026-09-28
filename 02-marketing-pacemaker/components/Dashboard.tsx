"use client";

import { Campaign, CampaignGroup, SHORT_CHANNEL_LABEL } from "@/lib/types";
import { loadMissions, upsertCampaign } from "@/lib/storage";
import CampaignSettings from "./CampaignSettings";
import ChannelCard from "./ChannelCard";
import Timeline from "./Timeline";

export default function Dashboard({
  campaigns,
  onCampaignsChange,
}: {
  group: CampaignGroup;
  campaigns: Campaign[];
  onCampaignsChange: (campaigns: Campaign[]) => void;
}) {
  const handleCampaignChange = (updated: Campaign) => {
    upsertCampaign(updated);
    onCampaignsChange(campaigns.map((c) => (c.id === updated.id ? updated : c)));
  };

  const isMulti = campaigns.length > 1;

  const crossPromoLink = (
    <a
      href="https://03-fastlane-clone.vercel.app/?utm_source=02ho&utm_medium=app_link&utm_campaign=cross_promo"
      target="_blank"
      rel="noopener"
      className="text-center text-sm text-zinc-500 transition hover:text-black"
    >
      숏폼 영상 대본이 필요하세요? → <span className="font-bold text-black">숏폼 대본 공장</span> (URL 하나로 대본 10편, 첫 1회 무료)
    </a>
  );

  if (!isMulti) {
    const campaign = campaigns[0];
    const missions = loadMissions(campaign.id);
    return (
      <div className="flex min-h-screen flex-col items-center bg-white px-4 py-8 sm:px-8">
        <div className="flex w-full max-w-xl flex-col gap-6">
          <ChannelCard campaign={campaign} onCampaignChange={handleCampaignChange} />
          <CampaignSettings campaign={campaign} onCampaignChange={handleCampaignChange} />
          <Timeline campaign={campaign} missions={missions} onCampaignChange={handleCampaignChange} />
          {crossPromoLink}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 py-8 sm:px-8">
      <div className="flex w-full max-w-xl flex-col gap-4">
        <div className="rounded-2xl bg-black px-4 py-3 text-center">
          <p className="text-lg font-bold text-yellow-400 sm:text-xl">
            {campaigns
              .map((c) => `${SHORT_CHANNEL_LABEL[c.channel_type]} D+${c.current_day}`)
              .join(" · ")}
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-300">
            오늘 할 일 {campaigns.length}개 채널
          </p>
        </div>

        {campaigns.map((c) => (
          <ChannelCard key={c.id} campaign={c} onCampaignChange={handleCampaignChange} compact />
        ))}
        {crossPromoLink}
      </div>
    </div>
  );
}
