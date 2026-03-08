// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, FileText, Settings, X } from "lucide-react";
import { SequenceBuilder } from "@/components/campaigns/sequence-builder";
import { toast } from "sonner";

type TabKey = "analytics" | "leads" | "sequences" | "schedule" | "accounts";

const TABS: { key: TabKey; label: string }[] = [
    { key: "analytics", label: "Analytics" },
    { key: "leads", label: "Leads" },
    { key: "sequences", label: "Sequences" },
    { key: "schedule", label: "Schedule" },
    { key: "accounts", label: "LinkedIn Accounts" },
];

interface SequenceTemplate {
    id: string;
    name: string;
    description: string;
    steps: string[];
    replyRate: string;
    category: string;
}

const SEQUENCE_TEMPLATES: SequenceTemplate[] = [
    { id: "t1", name: "Classic Outreach", description: "Standard connection request → follow-up sequence for B2B sales.", steps: ["View Profile", "Send Connection", "Wait 2d", "Send Message", "Wait 3d", "Follow-up"], replyRate: "18-24%", category: "Outreach" },
    { id: "t2", name: "Warm Engagement First", description: "Engage with content before reaching out — higher acceptance rates.", steps: ["View Profile", "Like Post", "Wait 1d", "Send Connection", "Wait 2d", "Send Message"], replyRate: "25-32%", category: "Engagement" },
    { id: "t3", name: "ICP Qualifier", description: "Score leads with AI before sending connection — only reach qualified prospects.", steps: ["ICP Score ≥ 70", "View Profile", "Send Connection", "Wait 2d", "Send Message", "Wait 3d", "Follow-up"], replyRate: "28-35%", category: "AI-Powered" },
    { id: "t4", name: "Multi-Touch Nurture", description: "Long-form nurture sequence with multiple value touchpoints.", steps: ["Send Connection", "Wait 3d", "Send Message", "Wait 5d", "Like Post", "Wait 2d", "Follow-up", "Wait 5d", "Final Follow-up"], replyRate: "20-28%", category: "Nurture" },
    { id: "t5", name: "Event-Based Outreach", description: "Leverage shared events or webinars for warm introductions.", steps: ["View Profile", "Send Connection (event note)", "Wait 1d", "Send Message", "Wait 2d", "Voice Note"], replyRate: "30-40%", category: "Events" },
];

interface CampaignEditorPayload {
    id: string;
    name: string;
    status: "draft" | "active" | "paused" | "completed" | "archived";
    scheduleTimezone: string;
    scheduleStartHour: number;
    scheduleEndHour: number;
    scheduleDays: string[];
}

export default function CampaignCreatePage() {
    const params = useParams<{ id: string }>();
    const campaignId = params?.id ?? "";
    const [tab, setTab] = useState<TabKey>("sequences");
    const [showTemplates, setShowTemplates] = useState(false);
    const [campaign, setCampaign] = useState<CampaignEditorPayload | null>(null);

    useEffect(() => {
        async function loadCampaign(): Promise<void> {
            if (!campaignId) {
                return;
            }

            const response = await fetch(`/api/campaigns/${campaignId}`, { cache: "no-store" });
            if (!response.ok) {
                return;
            }

            const payload: unknown = await response.json();
            const parsed = payload as { data?: CampaignEditorPayload };
            if (parsed.data) {
                setCampaign(parsed.data);
            }
        }

        void loadCampaign();
    }, [campaignId]);

    async function duplicateCampaignAction(): Promise<void> {
        if (!campaignId) {
            return;
        }

        const response = await fetch(`/api/campaigns/${campaignId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "duplicate" }),
        });

        if (!response.ok) {
            toast.error("Failed to duplicate campaign");
            return;
        }

        toast.success("Campaign duplicated");
    }

    async function saveCampaignChanges(): Promise<void> {
        if (!campaign) {
            return;
        }

        const response = await fetch(`/api/campaigns/${campaign.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: campaign.name,
                scheduleTimezone: campaign.scheduleTimezone,
                scheduleStartHour: campaign.scheduleStartHour,
                scheduleEndHour: campaign.scheduleEndHour,
                scheduleDays: campaign.scheduleDays,
            }),
        });

        if (!response.ok) {
            toast.error("Failed to save campaign");
            return;
        }

        toast.success("Campaign changes saved");
    }

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
                    <p className="text-sm text-[var(--text-secondary)]">{campaign?.name ?? "Outreach to Agency Owners"}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => setShowTemplates(true)} className="border border-white/10 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white">
                        <FileText className="mr-2 h-4 w-4" /> Templates
                    </Button>
                    <Button variant="ghost" onClick={() => void duplicateCampaignAction()} className="border border-white/10 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white">
                        <Copy className="mr-2 h-4 w-4" /> Duplicate Campaign
                    </Button>
                    <Button onClick={() => void saveCampaignChanges()} className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400">
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

            {/* Templates Modal */}
            {showTemplates && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[var(--bg-card)] p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Sequence Templates</h2>
                                <p className="text-sm text-[var(--text-secondary)]">Pre-built sequences to get started quickly</p>
                            </div>
                            <button onClick={() => setShowTemplates(false)} className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-white/10 hover:text-white">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                            {SEQUENCE_TEMPLATES.map((tmpl) => (
                                <div key={tmpl.id} className="rounded-xl border border-white/6 bg-white/[0.02] p-4 transition-colors hover:border-purple-500/30 hover:bg-purple-500/5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-medium text-[var(--text-primary)]">{tmpl.name}</h3>
                                                <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-300">{tmpl.category}</Badge>
                                                <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-300">{tmpl.replyRate} reply rate</Badge>
                                            </div>
                                            <p className="mt-1 text-xs text-[var(--text-muted)]">{tmpl.description}</p>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {tmpl.steps.map((step, i) => (
                                                    <span key={i} className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
                                                        {i > 0 && <span className="text-white/20">→</span>}
                                                        <span className="rounded bg-white/5 px-1.5 py-0.5">{step}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => setShowTemplates(false)}
                                            className="ml-3 shrink-0 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                                        >
                                            Use Template
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
