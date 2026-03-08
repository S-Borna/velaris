// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomSelect } from "@/components/ui/custom-select";
import { ArrowUpRight, ChevronUp, Lightbulb, Share2, Sparkles } from "lucide-react";

type TimeFilter = "1 day" | "1 week" | "1 month";
type CampaignFilter = "All Campaigns" | "Agency Owners" | "SaaS Founders" | "Inbound Campaign";
type SortKey = "sent" | "accepted" | "messages" | "replies" | "opportunitiesValue";
type SortOrder = "asc" | "desc";

interface AccountAnalyticsRow {
    account: string;
    campaign: CampaignFilter;
    sent: number;
    accepted: number;
    messages: number;
    replies: number;
    opportunitiesValue: number;
}

interface ActivityEvent {
    id: string;
    actor: string;
    action: string;
    when: string;
}

const TIME_FILTERS: TimeFilter[] = ["1 day", "1 week", "1 month"];

const TIME_MULTIPLIER: Record<TimeFilter, number> = {
    "1 day": 0.15,
    "1 week": 0.55,
    "1 month": 1,
};

const KPI_DELTAS = ["+8.2%", "+5.4%", "+4.1%", "+2.7%", "+11.0%"];

const ACCOUNT_ANALYTICS: AccountAnalyticsRow[] = [
    {
        account: "Said Borna",
        campaign: "Agency Owners",
        sent: 847,
        accepted: 512,
        messages: 693,
        replies: 204,
        opportunitiesValue: 68400,
    },
    {
        account: "Nolan Vance",
        campaign: "SaaS Founders",
        sent: 412,
        accepted: 227,
        messages: 306,
        replies: 71,
        opportunitiesValue: 18200,
    },
    {
        account: "Ezra Kaplan",
        campaign: "Inbound Campaign",
        sent: 395,
        accepted: 206,
        messages: 288,
        replies: 64,
        opportunitiesValue: 15600,
    },
    {
        account: "Wei Tanaka",
        campaign: "Agency Owners",
        sent: 338,
        accepted: 182,
        messages: 246,
        replies: 25,
        opportunitiesValue: 12400,
    },
];

const REALTIME_FEED: ActivityEvent[] = [
    { id: "a1", actor: "Said Borna", action: "closed 3 new opportunities worth $12.4K", when: "2 min ago" },
    { id: "a2", actor: "Nolan Vance", action: "sent 12 new connection requests", when: "9 min ago" },
    { id: "a3", actor: "Ezra Kaplan", action: "received 4 replies", when: "14 min ago" },
    { id: "a4", actor: "Wei Tanaka", action: "accepted 7 new connections", when: "26 min ago" },
];

const AI_INSIGHTS = [
    { text: "Said Borna is outperforming all other accounts with a 60% acceptance rate and 29% reply rate — 3x above average. His Agency Owners campaign alone generated $68.4K in pipeline.", type: "optimization" as const },
    { text: "Reply rates peak on Tuesday-Thursday between 9-11 AM CET. Adjust your campaign schedules to maximize engagement in this window.", type: "timing" as const },
    { text: "Wei Tanaka has the lowest reply rate (25/246 = 10.2%) despite decent volume. Consider revising his message templates or reassigning leads to Said Borna.", type: "alert" as const },
    { text: "Based on current trends, you're on track to hit 120 opportunities this quarter — 18% above target.", type: "forecast" as const },
];

const INSIGHT_COLORS: Record<string, string> = {
    optimization: "text-purple-400",
    timing: "text-blue-400",
    alert: "text-amber-400",
    forecast: "text-green-400",
};

function formatCurrency(amount: number): string {
    return `$${(amount / 1000).toFixed(1)}K`;
}

function sortRows(rows: AccountAnalyticsRow[], key: SortKey, order: SortOrder): AccountAnalyticsRow[] {
    const sorted = [...rows].sort((left, right) => left[key] - right[key]);
    if (order === "desc") {
        sorted.reverse();
    }
    return sorted;
}

function TimelineChart() {
    return (
        <div className="h-72 rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">Activity Timeline</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Connections, messages and replies over time</p>
                </div>
                <Badge className="border border-purple-500/40 bg-purple-500/10 text-purple-300">AI Insights Active</Badge>
            </div>

            <div className="relative h-52 overflow-hidden rounded-lg border border-white/6 bg-gradient-to-b from-white/[0.04] to-transparent p-4">
                <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full">
                    <defs>
                        <linearGradient id="timelineGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(139,92,246,0.45)" />
                            <stop offset="100%" stopColor="rgba(139,92,246,0.05)" />
                        </linearGradient>
                    </defs>
                    <path d="M0,30 C10,25 15,20 25,22 C35,23 40,15 50,17 C60,18 65,10 75,12 C85,13 90,7 100,9 L100,40 L0,40 Z" fill="url(#timelineGradient)" />
                    <path d="M0,30 C10,25 15,20 25,22 C35,23 40,15 50,17 C60,18 65,10 75,12 C85,13 90,7 100,9" stroke="rgba(168,85,247,0.95)" strokeWidth="1.4" fill="none" />
                </svg>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const [timeFilter, setTimeFilter] = useState<TimeFilter>("1 month");
    const [campaignFilter, setCampaignFilter] = useState<CampaignFilter>("All Campaigns");
    const [sortKey, setSortKey] = useState<SortKey>("sent");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [analyticsRows, setAnalyticsRows] = useState<AccountAnalyticsRow[]>([]);
    const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
    const [kpiDeltas, setKpiDeltas] = useState<string[]>(KPI_DELTAS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [statsRes, activityRes, campaignsRes] = await Promise.all([
                    fetch("/api/dashboard/stats"),
                    fetch("/api/dashboard/activity?pageSize=10"),
                    fetch("/api/campaigns?pageSize=100"),
                ]);
                if (statsRes.ok) {
                    const stats = await statsRes.json();
                    const pc = stats.percentChanges ?? {};
                    setKpiDeltas([
                        `${Number(pc.connectionsSent) >= 0 ? "+" : ""}${Number(pc.connectionsSent ?? 0).toFixed(1)}%`,
                        `${Number(pc.connectionsAccepted) >= 0 ? "+" : ""}${Number(pc.connectionsAccepted ?? 0).toFixed(1)}%`,
                        `${Number(pc.messagesSent) >= 0 ? "+" : ""}${Number(pc.messagesSent ?? 0).toFixed(1)}%`,
                        `${Number(pc.repliesReceived) >= 0 ? "+" : ""}${Number(pc.repliesReceived ?? 0).toFixed(1)}%`,
                        `${Number(pc.opportunitiesValue) >= 0 ? "+" : ""}${Number(pc.opportunitiesValue ?? 0).toFixed(1)}%`,
                    ]);
                }
                if (activityRes.ok) {
                    const actData = await activityRes.json();
                    const events: ActivityEvent[] = (actData.data ?? []).map((a: Record<string, unknown>, i: number) => {
                        const diffMs = Date.now() - new Date(String(a.createdAt)).getTime();
                        const mins = Math.floor(diffMs / 60000);
                        let when = "Just now";
                        if (mins >= 1440) when = `${Math.floor(mins / 1440)}d ago`;
                        else if (mins >= 60) when = `${Math.floor(mins / 60)}h ago`;
                        else if (mins >= 1) when = `${mins} min ago`;
                        return { id: String(a.id ?? i), actor: "System", action: String(a.action ?? ""), when };
                    });
                    setActivityFeed(events.length > 0 ? events : REALTIME_FEED);
                }
                if (campaignsRes.ok) {
                    const campData = await campaignsRes.json();
                    const rows: AccountAnalyticsRow[] = (campData.data ?? []).slice(0, 6).map((c: Record<string, unknown>) => ({
                        account: String(c.name).split(" ").slice(0, 2).join(" "),
                        campaign: String(c.name) as CampaignFilter,
                        sent: Number(c.connectionsSent) || 0,
                        accepted: Number(c.connectionsAccepted) || 0,
                        messages: Number(c.messagesSent) || 0,
                        replies: Number(c.repliesReceived) || 0,
                        opportunitiesValue: Number(c.opportunitiesValue) || 0,
                    }));
                    if (rows.length > 0) setAnalyticsRows(rows);
                    else setAnalyticsRows(ACCOUNT_ANALYTICS);
                }
            } catch {
                setAnalyticsRows(ACCOUNT_ANALYTICS);
                setActivityFeed(REALTIME_FEED);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const filteredRows = useMemo(() => {
        if (campaignFilter === "All Campaigns") {
            return analyticsRows;
        }

        return analyticsRows.filter((row) => row.campaign === campaignFilter);
    }, [campaignFilter, analyticsRows]);

    const sortedRows = useMemo(() => sortRows(filteredRows, sortKey, sortOrder), [filteredRows, sortKey, sortOrder]);

    const multiplier = TIME_MULTIPLIER[timeFilter];

    const totals = useMemo(() => {
        const sent = filteredRows.reduce((sum, row) => sum + row.sent, 0);
        const accepted = filteredRows.reduce((sum, row) => sum + row.accepted, 0);
        const messages = filteredRows.reduce((sum, row) => sum + row.messages, 0);
        const replies = filteredRows.reduce((sum, row) => sum + row.replies, 0);
        const opportunities = filteredRows.reduce((sum, row) => sum + row.opportunitiesValue, 0);

        return {
            sent: Math.round(sent * multiplier),
            accepted: Math.round(accepted * multiplier),
            messages: Math.round(messages * multiplier),
            replies: Math.round(replies * multiplier),
            opportunities: Math.round(opportunities * multiplier),
        };
    }, [filteredRows, multiplier]);

    const funnel = {
        sent: totals.sent,
        accepted: totals.accepted,
        replied: totals.replies,
        opportunity: Math.max(1, Math.round(totals.replies * 0.4)),
    };

    function toggleSort(nextKey: SortKey): void {
        if (sortKey === nextKey) {
            setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
            return;
        }

        setSortKey(nextKey);
        setSortOrder("desc");
    }

    const campaigns: CampaignFilter[] = ["All Campaigns", "Agency Owners", "SaaS Founders", "Inbound Campaign"];

    if (loading) return <div className="flex h-96 items-center justify-center"><p className="text-sm text-[var(--text-muted)]">Loading dashboard…</p></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
                    <p className="text-sm text-[var(--text-secondary)]">Campaign analytics and performance overview</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-lg border border-white/10 bg-[var(--bg-input)] p-1">
                        {TIME_FILTERS.map((filter) => (
                            <button
                                key={filter}
                                type="button"
                                onClick={() => setTimeFilter(filter)}
                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${timeFilter === filter ? "bg-purple-500 text-white" : "text-[var(--text-secondary)] hover:bg-white/5"}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    <CustomSelect
                        aria-label="Filter by campaign"
                        value={campaignFilter}
                        onChange={(val) => setCampaignFilter(val as CampaignFilter)}
                        options={campaigns.map((c) => ({ label: c, value: c }))}
                        triggerClassName="h-9 w-[180px]"
                    />

                    <Button className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400">
                        <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)] transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5">
                    <div className="h-1 bg-blue-500" />
                    <div className="p-4">
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Connections Sent</p>
                        <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{totals.sent.toLocaleString()}</p>
                        <p className="mt-2 inline-flex items-center text-xs text-green-400"><ArrowUpRight className="mr-1 h-3 w-3" />{kpiDeltas[0]}</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)] transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5">
                    <div className="h-1 bg-purple-500" />
                    <div className="p-4">
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Connections Accepted</p>
                        <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{totals.accepted.toLocaleString()}</p>
                        <p className="mt-2 inline-flex items-center text-xs text-green-400"><ArrowUpRight className="mr-1 h-3 w-3" />{kpiDeltas[1]}</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)] transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5">
                    <div className="h-1 bg-orange-500" />
                    <div className="p-4">
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Messages Sent</p>
                        <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{totals.messages.toLocaleString()}</p>
                        <p className="mt-2 inline-flex items-center text-xs text-green-400"><ArrowUpRight className="mr-1 h-3 w-3" />{kpiDeltas[2]}</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)] transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5">
                    <div className="h-1 bg-red-500" />
                    <div className="p-4">
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Reply Received</p>
                        <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{totals.replies.toLocaleString()}</p>
                        <p className="mt-2 inline-flex items-center text-xs text-green-400"><ArrowUpRight className="mr-1 h-3 w-3" />{kpiDeltas[3]}</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)] transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5">
                    <div className="h-1 bg-cyan-400" />
                    <div className="p-4">
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Opportunities</p>
                        <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{formatCurrency(totals.opportunities)}</p>
                        <p className="mt-2 inline-flex items-center text-xs text-green-400"><ArrowUpRight className="mr-1 h-3 w-3" />{kpiDeltas[4]}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <TimelineChart />
                </div>

                <div>
                    <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                        <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">Conversion Funnel</h3>
                        <div className="space-y-1 text-sm">
                            <div>
                                <div className="mb-1 flex items-center justify-between text-[var(--text-secondary)]"><span>Connections Sent</span><span>{funnel.sent}</span></div>
                                <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-blue-500 transition-all duration-700" style={{ width: "100%" }} /></div>
                            </div>
                            <div className="flex items-center justify-center">
                                <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-300">
                                    {funnel.sent > 0 ? Math.round((funnel.accepted / funnel.sent) * 100) : 0}% accepted
                                </span>
                            </div>
                            <div>
                                <div className="mb-1 flex items-center justify-between text-[var(--text-secondary)]"><span>Accepted</span><span>{funnel.accepted}</span></div>
                                <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-purple-500 transition-all duration-700" style={{ width: `${Math.max(6, Math.round((funnel.accepted / Math.max(1, funnel.sent)) * 100))}%` }} /></div>
                            </div>
                            <div className="flex items-center justify-center">
                                <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-300">
                                    {funnel.accepted > 0 ? Math.round((funnel.replied / funnel.accepted) * 100) : 0}% replied
                                </span>
                            </div>
                            <div>
                                <div className="mb-1 flex items-center justify-between text-[var(--text-secondary)]"><span>Replied</span><span>{funnel.replied}</span></div>
                                <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-orange-500 transition-all duration-700" style={{ width: `${Math.max(4, Math.round((funnel.replied / Math.max(1, funnel.sent)) * 100))}%` }} /></div>
                            </div>
                            <div className="flex items-center justify-center">
                                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                                    {funnel.replied > 0 ? Math.round((funnel.opportunity / funnel.replied) * 100) : 0}% converted
                                </span>
                            </div>
                            <div>
                                <div className="mb-1 flex items-center justify-between text-[var(--text-secondary)]"><span>Opportunity</span><span>{funnel.opportunity}</span></div>
                                <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-cyan-400 transition-all duration-700" style={{ width: `${Math.max(3, Math.round((funnel.opportunity / Math.max(1, funnel.sent)) * 100))}%` }} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Feed + AI Insights — side by side, full width */}
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-[var(--text-primary)]">Real-time Activity Feed</h3>
                            <Badge className="border border-green-500/30 bg-green-500/10 text-green-300">Live</Badge>
                        </div>
                        <ul className="space-y-3 text-sm">
                            {activityFeed.map((event) => (
                                <li key={event.id} className="rounded-lg border border-white/8 bg-white/[0.02] p-3 transition-colors duration-150 hover:bg-white/[0.04]">
                                    <p className="text-[var(--text-primary)]"><span className="font-medium">{event.actor}</span> {event.action}</p>
                                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{event.when}</p>
                                </li>
                            ))}
                        </ul>
                </div>

                {/* AI Insights */}
                <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
                                <Sparkles className="h-4 w-4 text-purple-400" />
                                AI Insights
                            </h3>
                            <Badge className="border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[10px]">Powered by Claude</Badge>
                        </div>
                        <ul className="space-y-3 text-sm">
                            {AI_INSIGHTS.map((insight, i) => (
                                <li key={i} className="flex gap-2.5 rounded-lg border border-white/6 bg-white/[0.02] p-3">
                                    <Lightbulb className={`mt-0.5 h-4 w-4 shrink-0 ${INSIGHT_COLORS[insight.type]}`} />
                                    <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{insight.text}</p>
                                </li>
                            ))}
                        </ul>
                </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">Account Analytics</h3>
                    <Badge className="border border-white/10 bg-white/5 text-[var(--text-secondary)]">Sortable & Filterable</Badge>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
                                <th className="px-3 py-3 font-medium">Account</th>
                                <th className="px-3 py-3 font-medium">
                                    <button type="button" onClick={() => toggleSort("sent")} className="inline-flex items-center gap-1 transition-colors hover:text-white">Conn. Sent <ChevronUp className={`h-3.5 w-3.5 ${sortKey === "sent" && sortOrder === "asc" ? "rotate-180" : ""}`} /></button>
                                </th>
                                <th className="px-3 py-3 font-medium">
                                    <button type="button" onClick={() => toggleSort("accepted")} className="inline-flex items-center gap-1 transition-colors hover:text-white">Accepted <ChevronUp className={`h-3.5 w-3.5 ${sortKey === "accepted" && sortOrder === "asc" ? "rotate-180" : ""}`} /></button>
                                </th>
                                <th className="px-3 py-3 font-medium">
                                    <button type="button" onClick={() => toggleSort("messages")} className="inline-flex items-center gap-1 transition-colors hover:text-white">Msgs Sent <ChevronUp className={`h-3.5 w-3.5 ${sortKey === "messages" && sortOrder === "asc" ? "rotate-180" : ""}`} /></button>
                                </th>
                                <th className="px-3 py-3 font-medium">
                                    <button type="button" onClick={() => toggleSort("replies")} className="inline-flex items-center gap-1 transition-colors hover:text-white">Replies <ChevronUp className={`h-3.5 w-3.5 ${sortKey === "replies" && sortOrder === "asc" ? "rotate-180" : ""}`} /></button>
                                </th>
                                <th className="px-3 py-3 font-medium">
                                    <button type="button" onClick={() => toggleSort("opportunitiesValue")} className="inline-flex items-center gap-1 transition-colors hover:text-white">Opportunities <ChevronUp className={`h-3.5 w-3.5 ${sortKey === "opportunitiesValue" && sortOrder === "asc" ? "rotate-180" : ""}`} /></button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRows.map((row) => (
                                <tr key={row.account} className="border-b border-white/6 text-[var(--text-primary)] transition-colors hover:bg-white/[0.02]">
                                    <td className="px-3 py-3">{row.account}</td>
                                    <td className="px-3 py-3">{Math.round(row.sent * multiplier)}</td>
                                    <td className="px-3 py-3">{Math.round(row.accepted * multiplier)}</td>
                                    <td className="px-3 py-3">{Math.round(row.messages * multiplier)}</td>
                                    <td className="px-3 py-3">{Math.round(row.replies * multiplier)}</td>
                                    <td className="px-3 py-3 text-cyan-300">{formatCurrency(Math.round(row.opportunitiesValue * multiplier))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
