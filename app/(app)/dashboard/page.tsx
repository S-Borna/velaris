// Copyright (c) Said Borna. All rights reserved.
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ChevronDown, ChevronUp, Share2 } from "lucide-react";

const KPI_CARDS = [
    {
        label: "Connections Sent",
        value: "1,630",
        accent: "bg-blue-500",
        delta: "+8.2%",
    },
    {
        label: "Connections Accepted",
        value: "848",
        accent: "bg-purple-500",
        delta: "+5.4%",
    },
    {
        label: "Messages Sent",
        value: "1,162",
        accent: "bg-orange-500",
        delta: "+4.1%",
    },
    {
        label: "Reply Received",
        value: "203",
        accent: "bg-red-500",
        delta: "+2.7%",
    },
    {
        label: "Opportunities",
        value: "$70K",
        accent: "bg-cyan-400",
        delta: "+11.0%",
    },
];

const ACCOUNT_ANALYTICS = [
    {
        account: "Mathias Warg",
        sent: 412,
        accepted: 227,
        messages: 306,
        replies: 71,
        opportunities: "$18.2K",
    },
    {
        account: "[redacted]",
        sent: 395,
        accepted: 206,
        messages: 288,
        replies: 64,
        opportunities: "$15.6K",
    },
    {
        account: "[redacted]",
        sent: 338,
        accepted: 182,
        messages: 246,
        replies: 43,
        opportunities: "$12.4K",
    },
    {
        account: "Martin Smith",
        sent: 485,
        accepted: 233,
        messages: 322,
        replies: 25,
        opportunities: "$23.8K",
    },
];

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
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
                    <p className="text-sm text-[var(--text-secondary)]">Campaign analytics and performance overview</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" className="border-white/10 bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                        1 month <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="border-white/10 bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                        Filter by Campaign <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                    <Button className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400">
                        <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {KPI_CARDS.map((card) => (
                    <div key={card.label} className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)]">
                        <div className={`h-1 ${card.accent}`} />
                        <div className="p-4">
                            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">{card.label}</p>
                            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{card.value}</p>
                            <p className="mt-2 inline-flex items-center text-xs text-green-400">
                                <ArrowUpRight className="mr-1 h-3 w-3" />
                                {card.delta}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <TimelineChart />

            <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">Account Analytics</h3>
                    <Badge className="border border-white/10 bg-white/5 text-[var(--text-secondary)]">Sortable</Badge>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
                                <th className="px-3 py-3 font-medium">Account</th>
                                <th className="px-3 py-3 font-medium">Conn. Sent <ChevronUp className="inline h-3.5 w-3.5" /></th>
                                <th className="px-3 py-3 font-medium">Accepted</th>
                                <th className="px-3 py-3 font-medium">Msgs Sent</th>
                                <th className="px-3 py-3 font-medium">Replies</th>
                                <th className="px-3 py-3 font-medium">Opportunities</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ACCOUNT_ANALYTICS.map((row) => (
                                <tr key={row.account} className="border-b border-white/6 text-[var(--text-primary)]">
                                    <td className="px-3 py-3">{row.account}</td>
                                    <td className="px-3 py-3">{row.sent}</td>
                                    <td className="px-3 py-3">{row.accepted}</td>
                                    <td className="px-3 py-3">{row.messages}</td>
                                    <td className="px-3 py-3">{row.replies}</td>
                                    <td className="px-3 py-3 text-cyan-300">{row.opportunities}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
