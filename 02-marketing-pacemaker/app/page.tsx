"use client";

import { useEffect, useState } from "react";
import { Campaign, CampaignGroup } from "@/lib/types";
import { loadCampaigns, loadGroup } from "@/lib/storage";
import Onboarding from "@/components/Onboarding";
import OnboardingLite from "@/components/OnboardingLite";
import Dashboard from "@/components/Dashboard";

// 멀티채널 동시 온보딩(Onboarding.tsx)은 삭제하지 않고 플래그로만 비활성화.
// 프리미엄 기능으로 재활성화할 때 이 값만 true로 바꾸면 된다.
const MULTI_CHANNEL_ENABLED = false;

export default function Home() {
  const [group, setGroup] = useState<CampaignGroup | null | undefined>(undefined);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    setGroup(loadGroup());
    setCampaigns(loadCampaigns());
  }, []);

  if (group === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-lg text-zinc-500">불러오는 중...</p>
      </div>
    );
  }

  if (!group || campaigns.length === 0) {
    const handleCreated = (g: CampaignGroup, cs: Campaign[]) => {
      setGroup(g);
      setCampaigns(cs);
    };
    return MULTI_CHANNEL_ENABLED ? (
      <Onboarding onCreated={handleCreated} />
    ) : (
      <OnboardingLite onCreated={handleCreated} />
    );
  }

  return <Dashboard group={group} campaigns={campaigns} onCampaignsChange={setCampaigns} />;
}
