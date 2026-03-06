// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ChevronUp, Share2 } from "lucide-react";

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
        account: "Mathias Warg",
        campaign: "Agency Owners",
        sent: 412,
        accepted: 227,
        messages: 306,
        replies: 71,
        opportunitiesValue: 18200,
    },
    {
        account: "[redacted]",
        campaign: "SaaS Founders",
        sent: 395,
        accepted: 206,
        messages: 288,
        replies: 64,
        opportunitiesValue: 15600,
    },
    {
        account: "[redacted]",
        campaign: "Inbound Campaign",
        sent: 338,
        accepted: 182,
        messages: 246,
        replies: 43,
        opportunitiesValue: 12400,
    },
    {
        account: "Martin Smith",
        campaign: "Agency Owners",
        sent: 485,
        accepted: 233,
        messages: 322,
        replies: 25,
        opportunitiesValue: 23800,
    },
];

const REALTIME_FEED: ActivityEvent[] = [
    { id: "a1", actor: "Mathias Warg", action: "sent 12 new connection requests", when: "2 min ago" },
    { id: "a2", actor: "[redacted]", action: "received 4 replies", when: "9 min ago" },
    { id: "a3", actor: "[redacted]", action: "moved 2 leads to opportunities", when: "14 min ago" },
    { id: "a4", actor: "Martin Smith", action: "accepted 7 new connections", when: "26 min ago" },
];

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

    const filteredRows = useMemo(() => {
        if (campaignFilter === "All Campaigns") {
            return ACCOUNT_ANALYTICS;
        }

        return ACCOUNT_ANALYTICS.filter((row) => row.campaign === campaignFilter);
    }, [campaignFilter]);

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

                    <select
                        aria-label="Filter by campaign"
                        value={campaignFilter}
                        onChange={(event) => setCampaignFilter(event.target.value as CampaignFilter)}
                        className="h-9 rounded-lg border border-white/10 bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)]"
                    >
                        {campaigns.map((campaign) => (
                            <option key={campaign} value={campaign}>
                                {campaign}
                            </option>
                        ))}
                    </select>

                    <Button className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400">
                        <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)]">
                    <div className="h-1 bg-blue-500" />
                    <div className="p-4">
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Connections Sent</p>
                        <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{totals.sent.toLocaleString()}</p>
                        <p className="mt-2 inline-flex items-center text-xs text-green-400"><ArrowUpRight className="mr-1 h-3 w-3" />{KPI_DELTAS[0]}</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)]">
                    <div className="h-1 bg-purple-500" />
                    <div className="p-4">
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Connections Accepted</p>
                        <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{totals.accepted.toLocaleString()}</p>
                        <p className="mt-2 inline-flex items-center text-xs text-green-400"><ArrowUpRight className="mr-1 h-3 w-3" />{KPI_DELTAS[1]}</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)]">
                    <div className="h-1 bg-orange-500" />
                    <div className="p-4">
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Messages Sent</p>
                        <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{totals.messages.toLocaleString()}</p>
                        <p className="mt-2 inline-flex items-center text-xs text-green-400"><ArrowUpRight className="mr-1 h-3 w-3" />{KPI_DELTAS[2]}</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)]">
                    <div className="h-1 bg-red-500" />
                    <div className="p-4">
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Reply Received</p>
                        <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{totals.replies.toLocaleString()}</p>
                        <p className="mt-2 inline-flex items-center text-xs text-green-400"><ArrowUpRight className="mr-1 h-3 w-3" />{KPI_DELTAS[3]}</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)]">
                    <div className="h-1 bg-cyan-400" />
                    <div className="p-4">
                        <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Opportunities</p>
                        <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{formatCurrency(totals.opportunities)}</p>
                        <p className="mt-2 inline-flex items-center text-xs text-green-400"><ArrowUpRight className="mr-1 h-3 w-3" />{KPI_DELTAS[4]}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <div className="xl:col-span-2">
                    <TimelineChart />
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                        <h3 className="mb-3 text-base font-semibold text-[var(--text-primary)]">Conversion Funnel</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <div className="mb-1 flex items-center justify-between text-[var(--text-secondary)]"><span>Connections Sent</span><span>{funnel.sent}</span></div>
                                <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-blue-500" style={{ width: "100%" }} /></div>
                            </div>
                            <div>
                                <div className="mb-1 flex items-center justify-between text-[var(--text-secondary)]"><span>Accepted</span><span>{funnel.accepted}</span></div>
                                <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-purple-500" style={{ width: `${Math.max(6, Math.round((funnel.accepted / Math.max(1, funnel.sent)) * 100))}%` }} /></div>
                            </div>
                            <div>
                                <div className="mb-1 flex items-center justify-between text-[var(--text-secondary)]"><span>Replied</span><span>{funnel.replied}</span></div>
                                <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-orange-500" style={{ width: `${Math.max(4, Math.round((funnel.replied / Math.max(1, funnel.sent)) * 100))}%` }} /></div>
                            </div>
                            <div>
                                <div className="mb-1 flex items-center justify-between text-[var(--text-secondary)]"><span>Opportunity</span><span>{funnel.opportunity}</span></div>
                                <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-cyan-400" style={{ width: `${Math.max(3, Math.round((funnel.opportunity / Math.max(1, funnel.sent)) * 100))}%` }} /></div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-[var(--text-primary)]">Real-time Activity Feed</h3>
                            <Badge className="border border-green-500/30 bg-green-500/10 text-green-300">Live</Badge>
                        </div>
                        <ul className="space-y-3 text-sm">
                            {REALTIME_FEED.map((event) => (
                                <li key={event.id} className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
                                    <p className="text-[var(--text-primary)]"><span className="font-medium">{event.actor}</span> {event.action}</p>
                                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{event.when}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
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
                                    <button type="button" onClick={() => toggleSort("sent")} className="inline-flex items-center gap-1 hover:text-white">Conn. Sent <ChevronUp className={`h-3.5 w-3.5 ${sortKey === "sent" && sortOrder === "asc" ? "rotate-180" : ""}`} /></button>
                                </th>
                                <th className="px-3 py-3 font-medium">
                                    <button type="button" onClick={() => toggleSort("accepted")} className="inline-flex items-center gap-1 hover:text-white">Accepted <ChevronUp className={`h-3.5 w-3.5 ${sortKey === "accepted" && sortOrder === "asc" ? "rotate-180" : ""}`} /></button>
                                </th>
                                <th className="px-3 py-3 font-medium">
                                    <button type="button" onClick={() => toggleSort("messages")} className="inline-flex items-center gap-1 hover:text-white">Msgs Sent <ChevronUp className={`h-3.5 w-3.5 ${sortKey === "messages" && sortOrder === "asc" ? "rotate-180" : ""}`} /></button>
                                </th>
                                <th className="px-3 py-3 font-medium">
                                    <button type="button" onClick={() => toggleSort("replies")} className="inline-flex items-center gap-1 hover:text-white">Replies <ChevronUp className={`h-3.5 w-3.5 ${sortKey === "replies" && sortOrder === "asc" ? "rotate-180" : ""}`} /></button>
                                </th>
                                <th className="px-3 py-3 font-medium">
                                    <button type="button" onClick={() => toggleSort("opportunitiesValue")} className="inline-flex items-center gap-1 hover:text-white">Opportunities <ChevronUp className={`h-3.5 w-3.5 ${sortKey === "opportunitiesValue" && sortOrder === "asc" ? "rotate-180" : ""}`} /></button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRows.map((row) => (
                                <tr key={row.account} className="border-b border-white/6 text-[var(--text-primary)]">
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
