// Copyright (c) Said Borna. All rights reserved.
import { Megaphone } from "lucide-react";
import { PagePlaceholder } from "@/components/common/page-placeholder";

export default function CampaignCreatePage() {
  return (
    <PagePlaceholder
      title="Create Campaign"
      description="Campaign wizard with sequence builder — coming in Phase 3."
      icon={Megaphone}
    />
  );
}
