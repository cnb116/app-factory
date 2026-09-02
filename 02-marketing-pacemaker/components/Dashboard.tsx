"use client";

import { Campaign, CampaignGroup, SHORT_CHANNEL_LABEL } from "@/lib/types";
import { loadMissions, upsertCampaign } from "@/lib/storage";
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

  if (!isMulti) {
    const campaign = campaigns[0];
    const missions = loadMissions(campaign.id);
    return (
      <div className="flex min-h-screen flex-col items-center bg-white px-4 py-8 sm:px-8">
        <div className="flex w-full max-w-xl flex-col gap-6">
          <ChannelCard campaign={campaign} onCampaignChange={handleCampaignChange} />
          <Timeline currentDay={campaign.current_day} missions={missions} />
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
      </div>
    </div>
  );
}
