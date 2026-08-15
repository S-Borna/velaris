// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomSelect } from "@/components/ui/custom-select";
import { ChevronUp, Share2, Sparkles } from "lucide-react";

// ─── Constants ──────────────────────────────────────────

type TimeFilter = "1 day" | "1 week" | "1 month";
type SortKey =
    | "connectionsSent"
    | "connectionsAccepted"
    | "messagesSent"
    | "repliesReceived"
    | "opportunitiesValue";
type SortOrder = "asc" | "desc";

const TIME_FILTERS: TimeFilter[] = ["1 day", "1 week", "1 month"];

const TIME_FILTER_TO_RANGE: Record<TimeFilter, string> = {
    "1 day": "1d",
    "1 week": "7d",
    "1 month": "30d",
};

const ALL_CAMPAIGNS_VALUE = "__all__";

// ─── Interfaces ─────────────────────────────────────────

interface DashboardStats {
    connectionsSent: number;
    connectionsAccepted: number;
    messagesSent: number;
    repliesReceived: number;
    opportunitiesValue: number;
}

interface AccountAnalyticsRow {
    accountId: string;
    accountName: string;
    connectionsSent: number;
    connectionsAccepted: number;
    messagesSent: number;
    repliesReceived: number;
    opportunitiesValue: number;
}

interface TimelinePoint {
    date: string;
    connectionsSent: number;
    messagesSent: number;
    repliesReceived: number;
}

interface ActivityLogEntry {
    id: string;
    action: string;
    createdAt: string;
    metadata: Record<string, unknown> | null;
    linkedinAccount: { id: string; accountName: string } | null;
    campaign: { id: string; name: string } | null;
    lead: {
        id: string;
        fullName: string | null;
        firstName: string | null;
        lastName: string | null;
    } | null;
}

interface CampaignOption {
    id: string;
    name: string;
}

// ─── Helpers ────────────────────────────────────────────

function formatCurrency(amount: number): string {
    if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(0)}`;
}

function formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
}

function formatActionLabel(action: string): string {
    return action
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function buildActivityDescription(entry: ActivityLogEntry): string {
    const parts: string[] = [formatActionLabel(entry.action).toLowerCase()];

    if (entry.lead) {
        const leadName =
            entry.lead.fullName ??
            ([entry.lead.firstName, entry.lead.lastName].filter(Boolean).join(" ") ||
            "a lead");
        parts.push(`→ ${leadName}`);
    }

    if (entry.campaign) {
        parts.push(`(${entry.campaign.name})`);
    }

    return parts.join(" ");
}

function sortRows(
    rows: AccountAnalyticsRow[],
    key: SortKey,
    order: SortOrder,
): AccountAnalyticsRow[] {
    const sorted = [...rows].sort((left, right) => left[key] - right[key]);
    if (order === "desc") sorted.reverse();
    return sorted;
}

// ─── SVG Timeline Builders ──────────────────────────────

function buildTimelinePath(
    data: TimelinePoint[],
    metric: "connectionsSent" | "messagesSent" | "repliesReceived",
): string {
    if (data.length === 0) return "";

    const values = data.map((d) => d[metric]);
    const max = Math.max(...values, 1);

    const points = values.map((v, i) => ({
        x: data.length === 1 ? 50 : (i / (data.length - 1)) * 100,
        y: 40 - (v / max) * 35,
    }));

    if (points.length === 1) {
        return `M${points[0].x},${points[0].y}`;
    }

    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpx = (prev.x + curr.x) / 2;
        path += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }

    return path;
}

function buildTimelineAreaPath(
    data: TimelinePoint[],
    metric: "connectionsSent" | "messagesSent" | "repliesReceived",
): string {
    const linePath = buildTimelinePath(data, metric);
    if (!linePath) return "";

    const lastX = data.length === 1 ? 50 : 100;
    const firstX = data.length === 1 ? 50 : 0;

    return `${linePath} L${lastX},40 L${firstX},40 Z`;
}

// ─── Loading Skeletons ──────────────────────────────────

function SkeletonCard() {
    return (
        <div className="animate-pulse overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)]">
            <div className="h-1 bg-white/10" />
            <div className="space-y-3 p-4">
                <div className="h-3 w-24 rounded bg-white/10" />
                <div className="h-7 w-16 rounded bg-white/10" />
            </div>
        </div>
    );
}

function SkeletonTable() {
    return (
        <div className="animate-pulse rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
            <div className="mb-6 h-5 w-40 rounded bg-white/10" />
            <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                        {Array.from({ length: 6 }).map((_, j) => (
                            <div key={j} className="h-4 flex-1 rounded bg-white/10" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Timeline Chart Component ───────────────────────────

function TimelineChart({
    timeline,
    loading,
}: {
    timeline: TimelinePoint[];
    loading: boolean;
}) {
    if (loading) {
        return (
            <div className="h-72 animate-pulse rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                <div className="mb-2 h-5 w-32 rounded bg-white/10" />
                <div className="mb-4 h-3 w-56 rounded bg-white/10" />
                <div className="h-52 rounded-lg bg-white/5" />
            </div>
        );
    }

    const hasData = timeline.length > 0;

    return (
        <div className="h-72 rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        Activity Timeline
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Connections, messages and replies over time
                    </p>
                </div>
                <Badge className="border border-purple-500/40 bg-purple-500/10 text-purple-300">
                    Live Data
                </Badge>
            </div>

            <div className="relative h-52 overflow-hidden rounded-lg border border-white/6 bg-gradient-to-b from-white/[0.04] to-transparent p-4">
                {hasData ? (
                    <svg
                        viewBox="0 0 100 40"
                        preserveAspectRatio="none"
                        className="h-full w-full"
                    >
                        <defs>
                            <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgba(139,92,246,0.45)" />
                                <stop offset="100%" stopColor="rgba(139,92,246,0.05)" />
                            </linearGradient>
                        </defs>
                        <path
                            d={buildTimelineAreaPath(timeline, "connectionsSent")}
                            fill="url(#timelineGradient)"
                        />
                        <path
                            d={buildTimelinePath(timeline, "connectionsSent")}
                            stroke="rgba(168,85,247,0.95)"
                            strokeWidth="1.4"
                            fill="none"
                        />
                        <path
                            d={buildTimelinePath(timeline, "messagesSent")}
                            stroke="rgba(249,115,22,0.7)"
                            strokeWidth="0.8"
                            fill="none"
                        />
                        <path
                            d={buildTimelinePath(timeline, "repliesReceived")}
                            stroke="rgba(239,68,68,0.7)"
                            strokeWidth="0.8"
                            fill="none"
                        />
                    </svg>
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
                        No activity data for this period
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Dashboard Page ────────────────────────────────

export default function DashboardPage() {
    const [timeFilter, setTimeFilter] = useState<TimeFilter>("1 month");
    const [campaignId, setCampaignId] = useState<string>(ALL_CAMPAIGNS_VALUE);
    const [sortKey, setSortKey] = useState<SortKey>("connectionsSent");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [accountAnalytics, setAccountAnalytics] = useState<AccountAnalyticsRow[]>([]);
    const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
    const [recentActivity, setRecentActivity] = useState<ActivityLogEntry[]>([]);
    const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
    const [loadingStats, setLoadingStats] = useState(true);
    const [loadingActivity, setLoadingActivity] = useState(true);

    const range = TIME_FILTER_TO_RANGE[timeFilter];

    // Fetch campaigns for the filter dropdown (once on mount)
    useEffect(() => {
        async function fetchCampaigns(): Promise<void> {
            try {
                const res = await fetch("/api/campaigns?pageSize=100");
                if (!res.ok) return;
                const json = await res.json();
                const items: Array<{ id: string; name: string }> = json.data?.data ?? [];
                setCampaigns(items.map((c) => ({ id: c.id, name: c.name })));
            } catch {
                // Dropdown will only show "All Campaigns"
            }
        }
        fetchCampaigns();
    }, []);

    // Fetch dashboard stats (KPIs + account analytics)
    const fetchStats = useCallback(async () => {
        setLoadingStats(true);
        try {
            const params = new URLSearchParams({ range });
            if (campaignId !== ALL_CAMPAIGNS_VALUE) {
                params.set("campaignId", campaignId);
            }
            const res = await fetch(`/api/dashboard/stats?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch stats");
            const json = await res.json();
            setStats(json.data.stats);
            setAccountAnalytics(json.data.accountAnalytics);
        } catch {
            setStats(null);
            setAccountAnalytics([]);
        } finally {
            setLoadingStats(false);
        }
    }, [range, campaignId]);

    // Fetch activity (timeline chart + feed)
    const fetchActivity = useCallback(async () => {
        setLoadingActivity(true);
        try {
            const params = new URLSearchParams({ range, page: "1", pageSize: "20" });
            const res = await fetch(`/api/dashboard/activity?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch activity");
            const json = await res.json();
            setTimeline(json.data.timeline);
            setRecentActivity(json.data.recentActivity?.data ?? []);
        } catch {
            setTimeline([]);
            setRecentActivity([]);
        } finally {
            setLoadingActivity(false);
        }
    }, [range]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        fetchActivity();
    }, [fetchActivity]);

    const sortedAccounts = useMemo(
        () => sortRows(accountAnalytics, sortKey, sortOrder),
        [accountAnalytics, sortKey, sortOrder],
    );

    const totals: DashboardStats = stats ?? {
        connectionsSent: 0,
        connectionsAccepted: 0,
        messagesSent: 0,
        repliesReceived: 0,
        opportunitiesValue: 0,
    };

    const funnel = {
        sent: totals.connectionsSent,
        accepted: totals.connectionsAccepted,
        replied: totals.repliesReceived,
        opportunity: Math.max(0, Math.round(totals.repliesReceived * 0.4)),
    };

    function toggleSort(nextKey: SortKey): void {
        if (sortKey === nextKey) {
            setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
            return;
        }
        setSortKey(nextKey);
        setSortOrder("desc");
    }

    const campaignOptions = [
        { label: "All Campaigns", value: ALL_CAMPAIGNS_VALUE },
        ...campaigns.map((c) => ({ label: c.name, value: c.id })),
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Campaign analytics and performance overview
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-lg border border-white/10 bg-[var(--bg-input)] p-1">
                        {TIME_FILTERS.map((filter) => (
                            <button
                                key={filter}
                                type="button"
                                onClick={() => setTimeFilter(filter)}
                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                                    timeFilter === filter
                                        ? "bg-purple-500 text-white"
                                        : "text-[var(--text-secondary)] hover:bg-white/5"
                                }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    <CustomSelect
                        aria-label="Filter by campaign"
                        value={campaignId}
                        onChange={(val) => setCampaignId(val)}
                        options={campaignOptions}
                        triggerClassName="h-9 w-[180px]"
                    />

                    <Button className="bg-purple-600 text-white hover:bg-purple-500">
                        <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            {loadingStats ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20">
                        <div className="h-1 bg-blue-500" />
                        <div className="p-4">
                            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                                Connections Sent
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                                {totals.connectionsSent.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20">
                        <div className="h-1 bg-purple-500" />
                        <div className="p-4">
                            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                                Connections Accepted
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                                {totals.connectionsAccepted.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20">
                        <div className="h-1 bg-orange-500" />
                        <div className="p-4">
                            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                                Messages Sent
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                                {totals.messagesSent.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20">
                        <div className="h-1 bg-red-500" />
                        <div className="p-4">
                            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                                Reply Received
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                                {totals.repliesReceived.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20">
                        <div className="h-1 bg-cyan-400" />
                        <div className="p-4">
                            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                                Opportunities
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                                {formatCurrency(totals.opportunitiesValue)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline + Conversion Funnel */}
            <div className="grid gap-4 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <TimelineChart timeline={timeline} loading={loadingActivity} />
                </div>

                <div>
                    <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                        <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">
                            Conversion Funnel
                        </h3>
                        <div className="space-y-1 text-sm">
                            <div>
                                <div className="mb-1 flex items-center justify-between text-[var(--text-secondary)]">
                                    <span>Connections Sent</span>
                                    <span>{funnel.sent}</span>
                                </div>
                                <div className="h-2 rounded-full bg-white/10">
                                    <div
                                        className="h-2 rounded-full bg-blue-500 transition-all duration-700"
                                        style={{ width: "100%" }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-center">
                                <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-300">
                                    {funnel.sent > 0
                                        ? Math.round((funnel.accepted / funnel.sent) * 100)
                                        : 0}
                                    % accepted
                                </span>
                            </div>
                            <div>
                                <div className="mb-1 flex items-center justify-between text-[var(--text-secondary)]">
                                    <span>Accepted</span>
                                    <span>{funnel.accepted}</span>
                                </div>
                                <div className="h-2 rounded-full bg-white/10">
                                    <div
                                        className="h-2 rounded-full bg-purple-500 transition-all duration-700"
                                        style={{
                                            width: `${Math.max(6, Math.round((funnel.accepted / Math.max(1, funnel.sent)) * 100))}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-center">
                                <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-300">
                                    {funnel.accepted > 0
                                        ? Math.round((funnel.replied / funnel.accepted) * 100)
                                        : 0}
                                    % replied
                                </span>
                            </div>
                            <div>
                                <div className="mb-1 flex items-center justify-between text-[var(--text-secondary)]">
                                    <span>Replied</span>
                                    <span>{funnel.replied}</span>
                                </div>
                                <div className="h-2 rounded-full bg-white/10">
                                    <div
                                        className="h-2 rounded-full bg-orange-500 transition-all duration-700"
                                        style={{
                                            width: `${Math.max(4, Math.round((funnel.replied / Math.max(1, funnel.sent)) * 100))}%`,
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-center">
                                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                                    {funnel.replied > 0
                                        ? Math.round((funnel.opportunity / funnel.replied) * 100)
                                        : 0}
                                    % converted
                                </span>
                            </div>
                            <div>
                                <div className="mb-1 flex items-center justify-between text-[var(--text-secondary)]">
                                    <span>Opportunity</span>
                                    <span>{funnel.opportunity}</span>
                                </div>
                                <div className="h-2 rounded-full bg-white/10">
                                    <div
                                        className="h-2 rounded-full bg-cyan-400 transition-all duration-700"
                                        style={{
                                            width: `${Math.max(3, Math.round((funnel.opportunity / Math.max(1, funnel.sent)) * 100))}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Feed + AI Insights */}
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">
                            Real-time Activity Feed
                        </h3>
                        <Badge className="border border-green-500/30 bg-green-500/10 text-green-300">
                            Live
                        </Badge>
                    </div>
                    {loadingActivity ? (
                        <div className="animate-pulse space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="rounded-lg border border-white/8 bg-white/[0.02] p-3"
                                >
                                    <div className="h-4 w-3/4 rounded bg-white/10" />
                                    <div className="mt-2 h-3 w-16 rounded bg-white/10" />
                                </div>
                            ))}
                        </div>
                    ) : recentActivity.length === 0 ? (
                        <div className="flex h-40 items-center justify-center text-sm text-[var(--text-muted)]">
                            No recent activity
                        </div>
                    ) : (
                        <ul className="space-y-3 text-sm">
                            {recentActivity.map((entry) => (
                                <li
                                    key={entry.id}
                                    className="rounded-lg border border-white/8 bg-white/[0.02] p-3 transition-colors duration-150 hover:bg-white/[0.04]"
                                >
                                    <p className="text-[var(--text-primary)]">
                                        <span className="font-medium">
                                            {entry.linkedinAccount?.accountName ?? "System"}
                                        </span>{" "}
                                        {buildActivityDescription(entry)}
                                    </p>
                                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                                        {formatTimeAgo(entry.createdAt)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* AI Insights — placeholder until Claude integration */}
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                            AI Insights
                        </h3>
                        <Badge className="border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[10px]">
                            Powered by Claude
                        </Badge>
                    </div>
                    <div className="flex h-40 items-center justify-center text-sm text-[var(--text-muted)]">
                        <div className="text-center">
                            <Sparkles className="mx-auto mb-2 h-8 w-8 text-purple-500/30" />
                            <p>AI insights will appear once you have</p>
                            <p>active campaigns generating data.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Analytics Table */}
            {loadingStats ? (
                <SkeletonTable />
            ) : (
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">
                            Account Analytics
                        </h3>
                        <Badge className="border border-white/10 bg-white/5 text-[var(--text-secondary)]">
                            {accountAnalytics.length} account
                            {accountAnalytics.length !== 1 ? "s" : ""}
                        </Badge>
                    </div>

                    {accountAnalytics.length === 0 ? (
                        <div className="flex h-32 items-center justify-center text-sm text-[var(--text-muted)]">
                            No LinkedIn accounts connected yet
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
                                        <th className="px-3 py-3 font-medium">Account</th>
                                        <th className="px-3 py-3 font-medium">
                                            <button
                                                type="button"
                                                onClick={() => toggleSort("connectionsSent")}
                                                className="inline-flex items-center gap-1 transition-colors hover:text-white"
                                            >
                                                Conn. Sent{" "}
                                                <ChevronUp
                                                    className={`h-3.5 w-3.5 ${sortKey === "connectionsSent" && sortOrder === "asc" ? "rotate-180" : ""}`}
                                                />
                                            </button>
                                        </th>
                                        <th className="px-3 py-3 font-medium">
                                            <button
                                                type="button"
                                                onClick={() => toggleSort("connectionsAccepted")}
                                                className="inline-flex items-center gap-1 transition-colors hover:text-white"
                                            >
                                                Accepted{" "}
                                                <ChevronUp
                                                    className={`h-3.5 w-3.5 ${sortKey === "connectionsAccepted" && sortOrder === "asc" ? "rotate-180" : ""}`}
                                                />
                                            </button>
                                        </th>
                                        <th className="px-3 py-3 font-medium">
                                            <button
                                                type="button"
                                                onClick={() => toggleSort("messagesSent")}
                                                className="inline-flex items-center gap-1 transition-colors hover:text-white"
                                            >
                                                Msgs Sent{" "}
                                                <ChevronUp
                                                    className={`h-3.5 w-3.5 ${sortKey === "messagesSent" && sortOrder === "asc" ? "rotate-180" : ""}`}
                                                />
                                            </button>
                                        </th>
                                        <th className="px-3 py-3 font-medium">
                                            <button
                                                type="button"
                                                onClick={() => toggleSort("repliesReceived")}
                                                className="inline-flex items-center gap-1 transition-colors hover:text-white"
                                            >
                                                Replies{" "}
                                                <ChevronUp
                                                    className={`h-3.5 w-3.5 ${sortKey === "repliesReceived" && sortOrder === "asc" ? "rotate-180" : ""}`}
                                                />
                                            </button>
                                        </th>
                                        <th className="px-3 py-3 font-medium">
                                            <button
                                                type="button"
                                                onClick={() => toggleSort("opportunitiesValue")}
                                                className="inline-flex items-center gap-1 transition-colors hover:text-white"
                                            >
                                                Opportunities{" "}
                                                <ChevronUp
                                                    className={`h-3.5 w-3.5 ${sortKey === "opportunitiesValue" && sortOrder === "asc" ? "rotate-180" : ""}`}
                                                />
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedAccounts.map((row) => (
                                        <tr
                                            key={row.accountId}
                                            className="border-b border-white/6 text-[var(--text-primary)] transition-colors hover:bg-white/[0.02]"
                                        >
                                            <td className="px-3 py-3">{row.accountName}</td>
                                            <td className="px-3 py-3">
                                                {row.connectionsSent.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-3">
                                                {row.connectionsAccepted.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-3">
                                                {row.messagesSent.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-3">
                                                {row.repliesReceived.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-3 text-cyan-300">
                                                {formatCurrency(row.opportunitiesValue)}
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
