"use client";

import { useEffect, useState } from "react";
import { Campaign } from "@/lib/types";
import { loadCampaign } from "@/lib/storage";
import Onboarding from "@/components/Onboarding";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const [campaign, setCampaign] = useState<Campaign | null | undefined>(undefined);

  useEffect(() => {
    setCampaign(loadCampaign());
  }, []);

  if (campaign === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-lg text-zinc-500">불러오는 중...</p>
      </div>
    );
  }

  if (!campaign) {
    return <Onboarding onCreated={(c) => setCampaign(c)} />;
  }

  return <Dashboard campaign={campaign} onCampaignChange={setCampaign} />;
}
