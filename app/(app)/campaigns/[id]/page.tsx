// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Pause, Play, Settings } from "lucide-react";
import { toast } from "sonner";

type TabKey = "analytics" | "leads" | "sequences" | "schedule" | "accounts";

const TABS: { key: TabKey; label: string }[] = [
    { key: "analytics", label: "Analytics" },
    { key: "leads", label: "Leads" },
    { key: "sequences", label: "Sequences" },
    { key: "schedule", label: "Schedule" },
    { key: "accounts", label: "LinkedIn Accounts" },
];

const KPI_ACCENTS = ["border-blue-500", "border-purple-500", "border-orange-500", "border-red-500", "border-cyan-400"];

interface CampaignDetail {
    id: string;
    name: string;
    status: string;
    connectionsSent: number;
    connectionsAccepted: number;
    messagesSent: number;
    repliesReceived: number;
    opportunitiesValue: string;
    scheduleTimezone: string;
    scheduleStartHour: number;
    scheduleEndHour: number;
    scheduleDays: string[];
    createdAt: string;
}

interface CampaignLead {
    id: string;
    lead: { fullName: string; title: string; icpScore: number | null };
    status: string;
}

const MOCK_LEAD_ROWS = [
    { name: "Marcus Reyes", title: "CEO at Solace Technologies", status: "replied", score: 98 },
    { name: "Devansh Rao", title: "CEO at Northwind Software", status: "connected", score: 96 },
    { name: "Arvind Mehta", title: "CEO at Meridian Labs", status: "messaged", score: 94 },
    { name: "Elian Cross", title: "CEO at Cognivance AI", status: "pending", score: 92 },
    { name: "Adrian Voss", title: "CEO at Connectiv", status: "opportunity", score: 97 },
];

export default function CampaignDetailPage() {
    const params = useParams<{ id: string }>();
    const campaignId = params.id;
    const [tab, setTab] = useState<TabKey>("analytics");
    const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [leads, setLeads] = useState<{ name: string; title: string; status: string; score: number }[]>(MOCK_LEAD_ROWS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load(): Promise<void> {
            try {
                const res = await fetch(`/api/campaigns/${campaignId}`);
                if (!res.ok) throw new Error("fetch failed");
                const data = await res.json() as CampaignDetail;
                setCampaign(data);
                setIsPaused(data.status === "paused");
            } catch {
                /* keep null — fallback rendering */
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, [campaignId]);

    useEffect(() => {
        if (tab !== "leads") return;
        async function loadLeads(): Promise<void> {
            try {
                const res = await fetch(`/api/campaigns/${campaignId}/leads?pageSize=20`);
                if (!res.ok) throw new Error("fetch failed");
                const json = await res.json() as { data: CampaignLead[] };
                if (json.data && json.data.length > 0) {
                    setLeads(json.data.map((cl) => ({
                        name: cl.lead?.fullName ?? "Unknown",
                        title: cl.lead?.title ?? "",
                        status: cl.status,
                        score: cl.lead?.icpScore ?? 0,
                    })));
                }
            } catch {
                /* keep mock leads */
            }
        }
        void loadLeads();
    }, [tab, campaignId]);

    async function handleTogglePause(): Promise<void> {
        const newStatus = isPaused ? "active" : "paused";
        setIsPaused(!isPaused);
        try {
            const res = await fetch(`/api/campaigns/${campaignId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error("status change failed");
            toast.success(`Campaign ${newStatus === "active" ? "resumed" : "paused"}`);
        } catch {
            setIsPaused(isPaused);
            toast.error("Failed to change status");
        }
    }

    async function handleDuplicate(): Promise<void> {
        try {
            const res = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: `${campaign?.name ?? "Campaign"} (Copy)` }),
            });
            if (!res.ok) throw new Error("duplicate failed");
            toast.success("Campaign duplicated");
        } catch {
            toast.error("Failed to duplicate");
        }
    }

    if (loading) return <div className="flex h-96 items-center justify-center"><p className="text-sm text-[var(--text-muted)]">Loading campaign…</p></div>;

    const name = campaign?.name ?? "Outreach to Agency Owners";
    const created = campaign?.createdAt ? new Date(campaign.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Feb 14, 2026";
    const kpiValues = campaign
        ? [campaign.connectionsSent, campaign.connectionsAccepted, campaign.messagesSent, campaign.repliesReceived, Math.round(Number(campaign.opportunitiesValue) / 4000)]
        : [1240, 632, 1162, 278, 12];
    const kpiLabels = ["Connections Sent", "Connections Accepted", "Messages Sent", "Replies Received", "Opportunities"];
    const scheduleTz = campaign?.scheduleTimezone ?? "Europe/Stockholm";
    const scheduleHours = campaign ? `${String(campaign.scheduleStartHour).padStart(2, "0")}:00 — ${String(campaign.scheduleEndHour).padStart(2, "0")}:00` : "09:00 — 17:00";
    const scheduleDays = campaign?.scheduleDays?.join(", ") ?? "mon, tue, wed, thu, fri";

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/campaigns" className="rounded-lg border border-white/10 p-2 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{name}</h1>
                        <Badge className={`border ${isPaused ? "border-amber-500/30 bg-amber-500/15 text-amber-300" : "border-green-500/30 bg-green-500/15 text-green-300"}`}>
                            {isPaused ? "PAUSED" : "ACTIVE"}
                        </Badge>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">Created {created}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" className="border border-white/10 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white" onClick={() => void handleTogglePause()}>
                        {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                        {isPaused ? "Resume" : "Pause"}
                    </Button>
                    <Button variant="ghost" className="border border-white/10 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white" onClick={() => void handleDuplicate()}>
                        <Copy className="mr-2 h-4 w-4" /> Duplicate
                    </Button>
                    <Link href={`/campaigns/${campaignId}/create`}>
                        <Button variant="ghost" className="border border-white/10 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white">
                            <Settings className="mr-2 h-4 w-4" /> Edit
                        </Button>
                    </Link>
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

            {tab === "analytics" && (
                <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        {kpiLabels.map((label, i) => (
                            <div key={label} className={`rounded-xl border-t-2 ${KPI_ACCENTS[i]} border border-white/10 bg-[var(--bg-card)] p-4 transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5`}>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{kpiValues[i].toLocaleString()}</p>
                                <p className="mt-1 text-xs text-[var(--text-secondary)]">{label}</p>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-6">
                        <h3 className="mb-4 text-sm font-medium text-[var(--text-secondary)]">Campaign Performance Over Time</h3>
                        <div className="flex h-48 items-end gap-2">
                            {[35, 42, 58, 45, 72, 65, 80, 68, 90, 78, 95, 88].map((v, i) => (
                                <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-purple-600 to-purple-400 transition-all duration-200 hover:from-purple-500 hover:to-purple-300" style={{ height: `${v}%` }} />
                            ))}
                        </div>
                        <div className="mt-2 flex justify-between text-[10px] text-[var(--text-muted)]">
                            <span>Feb 14</span><span>Feb 21</span><span>Feb 28</span><span>Mar 6</span>
                        </div>
                    </div>
                </div>
            )}

            {tab === "leads" && (
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
                                    <th className="px-3 py-3 font-medium">Name</th>
                                    <th className="px-3 py-3 font-medium">Title</th>
                                    <th className="px-3 py-3 font-medium">Status</th>
                                    <th className="px-3 py-3 font-medium">ICP Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map((lead) => (
                                    <tr key={lead.name} className="border-b border-white/6 text-[var(--text-primary)] transition-colors hover:bg-white/[0.02]">
                                        <td className="px-3 py-3 font-medium">{lead.name}</td>
                                        <td className="px-3 py-3 text-[var(--text-secondary)]">{lead.title}</td>
                                        <td className="px-3 py-3"><Badge className="border border-white/10 bg-white/5 text-[var(--text-secondary)]">{lead.status}</Badge></td>
                                        <td className="px-3 py-3"><span className={lead.score >= 85 ? "text-green-400" : lead.score >= 70 ? "text-amber-400" : "text-[var(--text-secondary)]"}>{lead.score}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === "sequences" && (
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-6 text-center">
                    <p className="text-[var(--text-secondary)]">Sequence builder view — see campaign editor for full flowchart</p>
                    <Link href={`/campaigns/${campaignId}/create`}>
                        <Button className="mt-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400">Open Sequence Builder</Button>
                    </Link>
                </div>
            )}

            {tab === "schedule" && (
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-6">
                    <h3 className="mb-4 text-sm font-medium text-[var(--text-secondary)]">Campaign Schedule</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg border border-white/10 bg-[var(--bg-input)] p-4">
                            <p className="text-xs text-[var(--text-muted)]">Timezone</p>
                            <p className="mt-1 text-sm text-[var(--text-primary)]">{scheduleTz}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-[var(--bg-input)] p-4">
                            <p className="text-xs text-[var(--text-muted)]">Active Hours</p>
                            <p className="mt-1 text-sm text-[var(--text-primary)]">{scheduleHours}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-[var(--bg-input)] p-4">
                            <p className="text-xs text-[var(--text-muted)]">Active Days</p>
                            <p className="mt-1 text-sm text-[var(--text-primary)]">{scheduleDays}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-[var(--bg-input)] p-4">
                            <p className="text-xs text-[var(--text-muted)]">Daily Limits</p>
                            <p className="mt-1 text-sm text-[var(--text-primary)]">20 connections / 50 messages</p>
                        </div>
                    </div>
                </div>
            )}

            {tab === "accounts" && (
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
                                    <th className="px-3 py-3 font-medium">Account</th>
                                    <th className="px-3 py-3 font-medium">Status</th>
                                    <th className="px-3 py-3 font-medium">Assigned Leads</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-white/6 text-[var(--text-primary)] transition-colors hover:bg-white/[0.02]">
                                    <td className="px-3 py-3">Said Borna</td>
                                    <td className="px-3 py-3"><Badge className="border border-green-500/30 bg-green-500/15 text-green-300">Connected</Badge></td>
                                    <td className="px-3 py-3">312</td>
                                </tr>
                                <tr className="border-b border-white/6 text-[var(--text-primary)] transition-colors hover:bg-white/[0.02]">
                                    <td className="px-3 py-3">Nolan Vance</td>
                                    <td className="px-3 py-3"><Badge className="border border-green-500/30 bg-green-500/15 text-green-300">Connected</Badge></td>
                                    <td className="px-3 py-3">288</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
