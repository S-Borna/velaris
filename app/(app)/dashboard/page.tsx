// Copyright (c) Said Borna. All rights reserved.
import { LayoutDashboard } from "lucide-react";
import { PagePlaceholder } from "@/components/common/page-placeholder";

export default function DashboardPage() {
    return (
        <PagePlaceholder
            title="Dashboard"
            description="Campaign analytics and performance overview — coming in Phase 2."
            icon={LayoutDashboard}
        />
    );
}
