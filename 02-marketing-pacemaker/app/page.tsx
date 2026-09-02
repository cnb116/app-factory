"use client";

import { useEffect, useState } from "react";
import { Campaign, CampaignGroup } from "@/lib/types";
import { loadCampaigns, loadGroup } from "@/lib/storage";
import Onboarding from "@/components/Onboarding";
import Dashboard from "@/components/Dashboard";

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
    return (
      <Onboarding
        onCreated={(g, cs) => {
          setGroup(g);
          setCampaigns(cs);
        }}
      />
    );
  }

  return <Dashboard group={group} campaigns={campaigns} onCampaignsChange={setCampaigns} />;
}
