// Copyright (c) Said Borna. All rights reserved.
import { Megaphone } from "lucide-react";
import { PagePlaceholder } from "@/components/common/page-placeholder";

export default function NewCampaignPage() {
    return (
        <PagePlaceholder
            title="New Campaign"
            description="Campaign setup wizard — coming in Phase 3."
            icon={Megaphone}
        />
    );
}
