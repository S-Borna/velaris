// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Settings } from "lucide-react";
import { SequenceBuilder } from "@/components/campaigns/sequence-builder";

type TabKey = "analytics" | "leads" | "sequences" | "schedule" | "accounts";

const TABS: { key: TabKey; label: string }[] = [
    { key: "analytics", label: "Analytics" },
    { key: "leads", label: "Leads" },
    { key: "sequences", label: "Sequences" },
    { key: "schedule", label: "Schedule" },
    { key: "accounts", label: "LinkedIn Accounts" },
];

export default function CampaignCreatePage() {
    const [tab, setTab] = useState<TabKey>("sequences");

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/campaigns" className="rounded-lg border border-white/10 p-2 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Edit Campaign</h1>
                        <Badge className="border border-amber-500/30 bg-amber-500/15 text-amber-300">EDITING</Badge>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">Outreach to Agency Owners</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" className="border border-white/10 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white">
                        <Copy className="mr-2 h-4 w-4" /> Duplicate Campaign
                    </Button>
                    <Button className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400">
                        <Settings className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                </div>
            </div>

            <div className="flex gap-1 rounded-lg border border-white/10 bg-[var(--bg-input)] p-1">
                {TABS.map((t) => (
                    <button key={t.key} type="button" onClick={() => setTab(t.key)}
                        className={`rounded-md px-4 py-2 text-sm font-medium transition ${tab === t.key ? "bg-purple-500/20 text-purple-300" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "sequences" && <SequenceBuilder />}

            {tab !== "sequences" && (
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-12 text-center">
                    <p className="text-[var(--text-secondary)]">{tab.charAt(0).toUpperCase() + tab.slice(1)} editor — select Sequences tab for flowchart builder</p>
                </div>
            )}
        </div>
    );
}
