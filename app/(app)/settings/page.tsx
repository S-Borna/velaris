// Copyright (c) Said Borna. All rights reserved.
import { Settings } from "lucide-react";
import { PagePlaceholder } from "@/components/common/page-placeholder";

export default function SettingsPage() {
    return (
        <PagePlaceholder
            title="Settings"
            description="Profile, workspace, and billing settings — coming in Phase 9."
            icon={Settings}
        />
    );
}
