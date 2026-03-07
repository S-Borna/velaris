// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Copy,
    Pause,
    Play,
    Settings,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────

type Tab = "analytics" | "leads" | "sequences" | "schedule" | "accounts";

const TABS: Array<{ key: Tab; label: string }> = [
    { key: "analytics", label: "Analytics" },
    { key: "leads", label: "Leads" },
    { key: "sequences", label: "Sequences" },
    { key: "schedule", label: "Schedule" },
    { key: "accounts", label: "LinkedIn Accounts" },
];

interface Campaign {
    id: string;
    name: string;
    status: string;
    connectionsSent: number;
    connectionsAccepted: number;
    messagesSent: number;
    repliesReceived: number;
    opportunitiesValue: number | string;
    totalLeads: number;
    scheduleTimezone: string;
    scheduleStartHour: number;
    scheduleEndHour: number;
    scheduleDays: string[];
    createdAt: string;
    campaignAccounts: Array<{
        linkedinAccount: {
            id: string;
            accountName: string;
            status: string;
        };
    }>;
    _count?: { campaignLeads: number };
}

interface CampaignLead {
    id: string;
    status: string;
    lead: {
        id: string;
        fullName: string | null;
        firstName: string | null;
        lastName: string | null;
        title: string | null;
        company: string | null;
        icpScore: number | null;
    };
}

interface SequenceStep {
    id: string;
    stepOrder: number;
    actionType: string;
    messageTemplate: string | null;
    waitDays: number;
    conditionType: string | null;
    conditionValue: string | null;
}

const STATUS_BADGE_COLORS: Record<string, string> = {
    active: "border-green-500/30 bg-green-500/10 text-green-300",
    paused: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    draft: "border-white/10 bg-white/5 text-[var(--text-secondary)]",
    completed: "border-blue-500/30 bg-blue-500/10 text-blue-300",
};

const LEAD_STATUS_COLORS: Record<string, string> = {
    pending: "border-white/10 bg-white/5 text-[var(--text-secondary)]",
    connection_sent: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    connected: "border-green-500/30 bg-green-500/10 text-green-300",
    messaged: "border-purple-500/30 bg-purple-500/10 text-purple-300",
    replied: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    opportunity: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    not_interested: "border-red-500/30 bg-red-500/10 text-red-300",
    error: "border-red-500/30 bg-red-500/10 text-red-300",
};

// ─── Helpers ────────────────────────────────────────────

function formatHour(hour: number): string {
    const h = hour % 12 || 12;
    const ampm = hour < 12 ? "AM" : "PM";
    return `${h}:00 ${ampm}`;
}

function formatActionType(type: string): string {
    return type
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function getIcpColor(score: number | null): string {
    if (score === null) return "text-[var(--text-muted)]";
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
}

function getLeadDisplayName(lead: CampaignLead["lead"]): string {
    return (
        lead.fullName ??
        ([lead.firstName, lead.lastName].filter(Boolean).join(" ") ||
        "Unknown")
    );
}

// ─── Main Component ─────────────────────────────────────

export default function CampaignDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const [tab, setTab] = useState<Tab>("analytics");
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [leads, setLeads] = useState<CampaignLead[]>([]);
    const [sequences, setSequences] = useState<SequenceStep[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCampaign = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/campaigns/${id}`);
            if (!res.ok) throw new Error("Not found");
            const json = await res.json();
            setCampaign(json.data);
        } catch {
            setCampaign(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const fetchLeads = useCallback(async () => {
        try {
            const res = await fetch(`/api/campaigns/${id}/leads?pageSize=50`);
            if (!res.ok) return;
            const json = await res.json();
            setLeads(json.data?.leads?.data ?? []);
        } catch {
            setLeads([]);
        }
    }, [id]);

    const fetchSequences = useCallback(async () => {
        try {
            const res = await fetch(`/api/campaigns/${id}/sequences`);
            if (!res.ok) return;
            const json = await res.json();
            setSequences(json.data ?? []);
        } catch {
            setSequences([]);
        }
    }, [id]);

    useEffect(() => {
        fetchCampaign();
    }, [fetchCampaign]);

    useEffect(() => {
        if (tab === "leads") fetchLeads();
    }, [tab, fetchLeads]);

    useEffect(() => {
        if (tab === "sequences") fetchSequences();
    }, [tab, fetchSequences]);

    async function handleStatusToggle(): Promise<void> {
        if (!campaign) return;
        const newStatus = campaign.status === "active" ? "paused" : "active";
        try {
            const res = await fetch(`/api/campaigns/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) fetchCampaign();
        } catch {
            // Silent fail
        }
    }

    async function handleDuplicate(): Promise<void> {
        try {
            await fetch(`/api/campaigns/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "duplicate" }),
            });
        } catch {
            // Silent fail
        }
    }

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-8 w-64 rounded bg-white/10" />
                <div className="h-10 w-full rounded bg-white/10" />
                <div className="grid gap-4 md:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-xl bg-white/5" />
                    ))}
                </div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="flex h-64 items-center justify-center text-[var(--text-muted)]">
                Campaign not found
            </div>
        );
    }

    const isActive = campaign.status === "active";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/campaigns"
                        className="rounded-lg border border-white/10 p-2 transition-colors hover:bg-white/5"
                    >
                        <ArrowLeft className="h-4 w-4 text-[var(--text-secondary)]" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-[var(--text-primary)]">
                                {campaign.name}
                            </h1>
                            <Badge
                                className={
                                    STATUS_BADGE_COLORS[campaign.status] ??
                                    STATUS_BADGE_COLORS.draft
                                }
                            >
                                {campaign.status.toUpperCase()}
                            </Badge>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">
                            {campaign.totalLeads} leads
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStatusToggle}
                        className="border-white/10"
                    >
                        {isActive ? (
                            <Pause className="mr-1 h-3.5 w-3.5" />
                        ) : (
                            <Play className="mr-1 h-3.5 w-3.5" />
                        )}
                        {isActive ? "Pause" : "Resume"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDuplicate}
                        className="border-white/10"
                    >
                        <Copy className="mr-1 h-3.5 w-3.5" /> Duplicate
                    </Button>
                    <Link href={`/campaigns/${id}/create`}>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-white/10"
                        >
                            <Settings className="mr-1 h-3.5 w-3.5" /> Edit
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-lg border border-white/10 bg-[var(--bg-input)] p-1">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        className={`rounded-md px-4 py-2 text-xs font-medium transition ${
                            tab === t.key
                                ? "bg-purple-500 text-white"
                                : "text-[var(--text-secondary)] hover:bg-white/5"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === "analytics" && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid gap-4 md:grid-cols-5">
                        <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)]">
                            <div className="h-1 bg-blue-500" />
                            <div className="p-4">
                                <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                                    Connections Sent
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                                    {campaign.connectionsSent.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)]">
                            <div className="h-1 bg-purple-500" />
                            <div className="p-4">
                                <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                                    Accepted
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                                    {campaign.connectionsAccepted.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)]">
                            <div className="h-1 bg-orange-500" />
                            <div className="p-4">
                                <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                                    Messages Sent
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                                    {campaign.messagesSent.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)]">
                            <div className="h-1 bg-red-500" />
                            <div className="p-4">
                                <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                                    Replies
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                                    {campaign.repliesReceived.toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)]">
                            <div className="h-1 bg-cyan-400" />
                            <div className="p-4">
                                <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                                    Opportunities
                                </p>
                                <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                                    {Number(campaign.opportunitiesValue).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {tab === "leads" && (
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                    <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
                        Campaign Leads
                    </h3>
                    {leads.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-sm text-[var(--text-muted)]">
                            No leads assigned to this campaign
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
                                        <th className="px-3 py-3 font-medium">Name</th>
                                        <th className="px-3 py-3 font-medium">Title</th>
                                        <th className="px-3 py-3 font-medium">Company</th>
                                        <th className="px-3 py-3 font-medium">Status</th>
                                        <th className="px-3 py-3 font-medium">ICP Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((cl) => (
                                        <tr
                                            key={cl.id}
                                            className="border-b border-white/6 text-[var(--text-primary)] transition-colors hover:bg-white/[0.02]"
                                        >
                                            <td className="px-3 py-3 font-medium">
                                                {getLeadDisplayName(cl.lead)}
                                            </td>
                                            <td className="px-3 py-3 text-[var(--text-secondary)]">
                                                {cl.lead.title ?? "—"}
                                            </td>
                                            <td className="px-3 py-3 text-[var(--text-secondary)]">
                                                {cl.lead.company ?? "—"}
                                            </td>
                                            <td className="px-3 py-3">
                                                <Badge
                                                    className={`text-[10px] ${
                                                        LEAD_STATUS_COLORS[cl.status] ??
                                                        LEAD_STATUS_COLORS.pending
                                                    }`}
                                                >
                                                    {formatActionType(cl.status)}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span
                                                    className={`font-semibold ${getIcpColor(cl.lead.icpScore)}`}
                                                >
                                                    {cl.lead.icpScore ?? "—"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {tab === "sequences" && (
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">
                            Sequence Steps
                        </h3>
                        <Link href={`/campaigns/${id}/create`}>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-white/10 text-xs"
                            >
                                Open Sequence Builder
                            </Button>
                        </Link>
                    </div>
                    {sequences.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-sm text-[var(--text-muted)]">
                            No sequences configured — open the builder to get started
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {sequences.map((step, i) => (
                                <div
                                    key={step.id}
                                    className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-3"
                                >
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/10 text-xs font-bold text-purple-300">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-[var(--text-primary)]">
                                            {formatActionType(step.actionType)}
                                        </p>
                                        {step.messageTemplate && (
                                            <p className="mt-0.5 text-xs text-[var(--text-secondary)] line-clamp-1">
                                                {step.messageTemplate}
                                            </p>
                                        )}
                                        {step.actionType === "wait" && (
                                            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                                                Wait {step.waitDays} day
                                                {step.waitDays !== 1 ? "s" : ""}
                                            </p>
                                        )}
                                    </div>
                                    {step.conditionType && step.conditionType !== "always" && (
                                        <Badge className="border-yellow-500/30 bg-yellow-500/10 text-[10px] text-yellow-300">
                                            {formatActionType(step.conditionType)}
                                            {step.conditionValue
                                                ? `: ${step.conditionValue}`
                                                : ""}
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {tab === "schedule" && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                            Timezone
                        </p>
                        <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                            {campaign.scheduleTimezone}
                        </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                            Active Hours
                        </p>
                        <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                            {formatHour(campaign.scheduleStartHour)} –{" "}
                            {formatHour(campaign.scheduleEndHour)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                            Active Days
                        </p>
                        <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                            {campaign.scheduleDays
                                .map((d) => d.charAt(0).toUpperCase() + d.slice(1))
                                .join(", ")}
                        </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                            Total Leads
                        </p>
                        <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                            {campaign.totalLeads}
                        </p>
                    </div>
                </div>
            )}

            {tab === "accounts" && (
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                    <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
                        Linked Accounts
                    </h3>
                    {campaign.campaignAccounts.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-sm text-[var(--text-muted)]">
                            No LinkedIn accounts linked to this campaign
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
                                        <th className="px-3 py-3 font-medium">Account</th>
                                        <th className="px-3 py-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaign.campaignAccounts.map((ca) => (
                                        <tr
                                            key={ca.linkedinAccount.id}
                                            className="border-b border-white/6 text-[var(--text-primary)]"
                                        >
                                            <td className="px-3 py-3 font-medium">
                                                {ca.linkedinAccount.accountName}
                                            </td>
                                            <td className="px-3 py-3">
                                                <Badge
                                                    className={`text-[10px] ${
                                                        ca.linkedinAccount.status === "connected"
                                                            ? "border-green-500/30 bg-green-500/10 text-green-300"
                                                            : "border-white/10 bg-white/5 text-[var(--text-secondary)]"
                                                    }`}
                                                >
                                                    {ca.linkedinAccount.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
