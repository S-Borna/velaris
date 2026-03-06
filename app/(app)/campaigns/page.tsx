// Copyright (c) Said Borna. All rights reserved.
import { Megaphone } from "lucide-react";
import { PagePlaceholder } from "@/components/common/page-placeholder";

export default function CampaignsPage() {
    return (
        <PagePlaceholder
            title="Campaigns"
            description="View and manage outreach campaigns — coming in Phase 3."
            icon={Megaphone}
        />
    );
}
