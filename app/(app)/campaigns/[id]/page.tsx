// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Pause, Play, Settings } from "lucide-react";

type TabKey = "analytics" | "leads" | "sequences" | "schedule" | "accounts";

const TABS: { key: TabKey; label: string }[] = [
    { key: "analytics", label: "Analytics" },
    { key: "leads", label: "Leads" },
    { key: "sequences", label: "Sequences" },
    { key: "schedule", label: "Schedule" },
    { key: "accounts", label: "LinkedIn Accounts" },
];

const KPI_DATA = [
    { label: "Connections Sent", value: 1240, accent: "border-blue-500" },
    { label: "Connections Accepted", value: 632, accent: "border-purple-500" },
    { label: "Messages Sent", value: 1162, accent: "border-orange-500" },
    { label: "Replies Received", value: 278, accent: "border-red-500" },
    { label: "Opportunities", value: 12, accent: "border-cyan-400" },
];

const LEAD_ROWS = [
    { name: "Marcus Reyes", title: "CEO at Apple", status: "replied", score: 98 },
    { name: "Devansh Rao", title: "CEO at Microsoft", status: "connected", score: 96 },
    { name: "Arvind Mehta", title: "CEO at Alphabet", status: "messaged", score: 94 },
    { name: "Elian Cross", title: "CEO at Anthropic", status: "pending", score: 92 },
    { name: "Adrian Voss", title: "CEO at Meta", status: "opportunity", score: 97 },
];

export default function CampaignDetailPage() {
    const [tab, setTab] = useState<TabKey>("analytics");
    const [isPaused, setIsPaused] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/campaigns" className="rounded-lg border border-white/10 p-2 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Outreach to Agency Owners</h1>
                        <Badge className={`border ${isPaused ? "border-amber-500/30 bg-amber-500/15 text-amber-300" : "border-green-500/30 bg-green-500/15 text-green-300"}`}>
                            {isPaused ? "PAUSED" : "ACTIVE"}
                        </Badge>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">Created Feb 14, 2026</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" className="border border-white/10 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white" onClick={() => setIsPaused((p) => !p)}>
                        {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
                        {isPaused ? "Resume" : "Pause"}
                    </Button>
                    <Button variant="ghost" className="border border-white/10 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white">
                        <Copy className="mr-2 h-4 w-4" /> Duplicate
                    </Button>
                    <Link href="/campaigns/c1/create">
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
                        {KPI_DATA.map((kpi) => (
                            <div key={kpi.label} className={`rounded-xl border-t-2 ${kpi.accent} border border-white/10 bg-[var(--bg-card)] p-4 transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5`}>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{kpi.value.toLocaleString()}</p>
                                <p className="mt-1 text-xs text-[var(--text-secondary)]">{kpi.label}</p>
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
                                {LEAD_ROWS.map((lead) => (
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
                    <Link href="/campaigns/c1/create">
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
                            <p className="mt-1 text-sm text-[var(--text-primary)]">Europe/Stockholm (CET)</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-[var(--bg-input)] p-4">
                            <p className="text-xs text-[var(--text-muted)]">Active Hours</p>
                            <p className="mt-1 text-sm text-[var(--text-primary)]">09:00 — 17:00</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-[var(--bg-input)] p-4">
                            <p className="text-xs text-[var(--text-muted)]">Active Days</p>
                            <p className="mt-1 text-sm text-[var(--text-primary)]">Mon, Tue, Wed, Thu, Fri</p>
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
