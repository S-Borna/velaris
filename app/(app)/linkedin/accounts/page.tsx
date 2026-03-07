// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Linkedin, Plus } from "lucide-react";

type AccountStatus = "connected" | "syncing" | "error";

interface LinkedInAccountRow {
    id: string;
    account: string;
    status: AccountStatus;
    type: string;
    connections: number;
    dailyMessagesUsed: number;
    dailyMessagesLimit: number;
    healthScore: number;
    lastSync: string;
    warmupEnabled: boolean;
    proxyConfigured: boolean;
}

const INITIAL_ACCOUNTS: LinkedInAccountRow[] = [
    {
        id: "acc-1",
        account: "Said Borna",
        status: "connected",
        type: "Sales Navigator",
        connections: 14820,
        dailyMessagesUsed: 47,
        dailyMessagesLimit: 50,
        healthScore: 99,
        lastSync: "Just now",
        warmupEnabled: true,
        proxyConfigured: true,
    },
    {
        id: "acc-2",
        account: "Nolan Vance",
        status: "connected",
        type: "Premium",
        connections: 8240,
        dailyMessagesUsed: 22,
        dailyMessagesLimit: 50,
        healthScore: 89,
        lastSync: "5 min ago",
        warmupEnabled: false,
        proxyConfigured: true,
    },
    {
        id: "acc-3",
        account: "Ezra Kaplan",
        status: "syncing",
        type: "Premium",
        connections: 4508,
        dailyMessagesUsed: 18,
        dailyMessagesLimit: 50,
        healthScore: 78,
        lastSync: "Syncing now",
        warmupEnabled: true,
        proxyConfigured: false,
    },
    {
        id: "acc-4",
        account: "Wei Tanaka",
        status: "connected",
        type: "Basic",
        connections: 3192,
        dailyMessagesUsed: 0,
        dailyMessagesLimit: 50,
        healthScore: 52,
        lastSync: "1h ago",
        warmupEnabled: false,
        proxyConfigured: false,
    },
];

function StatusBadge({ status }: { status: AccountStatus }) {
    if (status === "connected") {
        return <Badge className="border border-green-500/30 bg-green-500/15 text-green-300">Connected</Badge>;
    }

    if (status === "syncing") {
        return <Badge className="border border-amber-500/30 bg-amber-500/15 text-amber-300">Syncing</Badge>;
    }

    return <Badge className="border border-red-500/30 bg-red-500/15 text-red-300">Error</Badge>;
}

function HealthBadge({ score }: { score: number }) {
    if (score >= 85) {
        return <Badge className="border border-green-500/30 bg-green-500/15 text-green-300">{score} Excellent</Badge>;
    }

    if (score >= 70) {
        return <Badge className="border border-amber-500/30 bg-amber-500/15 text-amber-300">{score} Stable</Badge>;
    }

    return <Badge className="border border-red-500/30 bg-red-500/15 text-red-300">{score} Risk</Badge>;
}

export default function LinkedInAccountsPage() {
    const [accounts, setAccounts] = useState<LinkedInAccountRow[]>(INITIAL_ACCOUNTS);

    const summary = useMemo(() => {
        const healthAverage = Math.round(accounts.reduce((sum, row) => sum + row.healthScore, 0) / accounts.length);
        const connectedCount = accounts.filter((row) => row.status === "connected").length;
        const warmupCount = accounts.filter((row) => row.warmupEnabled).length;
        const proxyCount = accounts.filter((row) => row.proxyConfigured).length;

        return { healthAverage, connectedCount, warmupCount, proxyCount };
    }, [accounts]);

    function toggleWarmup(id: string): void {
        setAccounts((current) =>
            current.map((row) => {
                if (row.id !== id) {
                    return row;
                }

                return { ...row, warmupEnabled: !row.warmupEnabled };
            }),
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">LinkedIn Accounts</h1>
                    <p className="text-sm text-[var(--text-secondary)]">Manage sender accounts, usage, sync status and health</p>
                </div>

                <Button className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400">
                    <Plus className="mr-2 h-4 w-4" />
                    Add LinkedIn Account
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-4 transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Connected Accounts</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{summary.connectedCount}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-4 transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Avg Health Score</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{summary.healthAverage}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-4 transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Warmup Enabled</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{summary.warmupCount}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-4 transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Proxy Configured</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{summary.proxyCount}</p>
                </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                <div className="mb-4 flex items-center gap-2 text-[var(--text-secondary)]">
                    <Linkedin className="h-4 w-4" />
                    <span className="text-sm">{accounts.length} accounts connected</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
                                <th className="px-3 py-3 font-medium">Account</th>
                                <th className="px-3 py-3 font-medium">Status</th>
                                <th className="px-3 py-3 font-medium">Type</th>
                                <th className="px-3 py-3 font-medium">Connections</th>
                                <th className="px-3 py-3 font-medium">Daily Messages Usage</th>
                                <th className="px-3 py-3 font-medium">Health</th>
                                <th className="px-3 py-3 font-medium">Warmup</th>
                                <th className="px-3 py-3 font-medium">Proxy</th>
                                <th className="px-3 py-3 font-medium">Last Sync</th>
                                <th className="px-3 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((row) => {
                                const usagePercent = Math.round((row.dailyMessagesUsed / row.dailyMessagesLimit) * 100);

                                return (
                                    <tr key={row.id} className="border-b border-white/6 text-[var(--text-primary)] transition-colors hover:bg-white/[0.02]">
                                        <td className="px-3 py-3">{row.account}</td>
                                        <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                                        <td className="px-3 py-3 text-[var(--text-secondary)]">{row.type}</td>
                                        <td className="px-3 py-3">{row.connections.toLocaleString()}</td>
                                        <td className="px-3 py-3">
                                            <div className="w-36">
                                                <p className="mb-1 text-xs text-[var(--text-secondary)]">{row.dailyMessagesUsed} / {row.dailyMessagesLimit}</p>
                                                <div className="h-1.5 rounded-full bg-white/10">
                                                    <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${usagePercent}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3"><HealthBadge score={row.healthScore} /></td>
                                        <td className="px-3 py-3">
                                            <button
                                                type="button"
                                                onClick={() => toggleWarmup(row.id)}
                                                className={`rounded-md border px-2 py-1 text-xs font-medium transition ${row.warmupEnabled ? "border-green-500/30 bg-green-500/15 text-green-300" : "border-white/15 bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"}`}
                                            >
                                                {row.warmupEnabled ? "Enabled" : "Disabled"}
                                            </button>
                                        </td>
                                        <td className="px-3 py-3">
                                            {row.proxyConfigured ? (
                                                <Badge className="border border-cyan-500/30 bg-cyan-500/15 text-cyan-300">Configured</Badge>
                                            ) : (
                                                <Badge className="border border-white/15 bg-white/5 text-[var(--text-secondary)]">Not Set</Badge>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-[var(--text-secondary)]">{row.lastSync}</td>
                                        <td className="px-3 py-3">
                                            <Button variant="ghost" size="sm" className="h-8 border border-white/10 bg-[var(--bg-input)] px-3 text-xs text-[var(--text-secondary)] hover:bg-white/10 hover:text-white">
                                                Manage
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
