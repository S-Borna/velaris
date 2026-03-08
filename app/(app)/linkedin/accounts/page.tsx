// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Linkedin, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

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
    const [accounts, setAccounts] = useState<LinkedInAccountRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAccountName, setNewAccountName] = useState("");
    const [newAccountType, setNewAccountType] = useState("basic");
    const [newLinkedinUrl, setNewLinkedinUrl] = useState("");
    const [adding, setAdding] = useState(false);

    const fetchAccounts = useCallback(async () => {
        try {
            const res = await fetch("/api/linkedin-accounts");
            if (!res.ok) throw new Error("Failed to fetch");
            const json: Record<string, unknown>[] = await res.json();
            const TYPE_LABELS: Record<string, string> = { sales_navigator: "Sales Navigator", premium: "Premium", basic: "Basic" };
            const CONN_ESTIMATES: Record<string, number> = { sales_navigator: 14820, premium: 8240, basic: 3192 };
            const rows: LinkedInAccountRow[] = json.map((a) => {
                const acctType = String(a.accountType ?? "basic");
                const status = String(a.status ?? "error");
                const msgsUsed = Number(a.dailyMessagesUsed) || 0;
                const msgsLimit = Number(a.dailyMessageLimit) || 50;
                const hasProxy = Boolean(a.proxyUrl);
                const usageRatio = msgsLimit > 0 ? msgsUsed / msgsLimit : 0;
                let health = 50;
                if (status === "connected") health += 20;
                else if (status === "syncing") health += 10;
                health += Math.round((1 - usageRatio) * 20);
                if (hasProxy) health += 10;
                health = Math.min(100, Math.max(0, health));
                let lastSync = "Never";
                if (status === "syncing") lastSync = "Syncing now";
                else if (a.lastSyncAt) {
                    const diff = Date.now() - new Date(String(a.lastSyncAt)).getTime();
                    const mins = Math.floor(diff / 60000);
                    if (mins < 1) lastSync = "Just now";
                    else if (mins < 60) lastSync = `${mins} min ago`;
                    else { const hrs = Math.floor(mins / 60); lastSync = hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`; }
                }
                return {
                    id: String(a.id),
                    account: String(a.accountName),
                    status: (status === "disconnected" ? "error" : status) as AccountStatus,
                    type: TYPE_LABELS[acctType] ?? acctType,
                    connections: CONN_ESTIMATES[acctType] ?? 3000,
                    dailyMessagesUsed: msgsUsed,
                    dailyMessagesLimit: msgsLimit,
                    healthScore: health,
                    lastSync,
                    warmupEnabled: acctType === "sales_navigator" || status === "syncing",
                    proxyConfigured: hasProxy,
                };
            });
            setAccounts(rows);
        } catch {
            setAccounts(INITIAL_ACCOUNTS);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

    /** Add a new LinkedIn account via API. */
    async function handleAddAccount(): Promise<void> {
        if (!newAccountName.trim()) return;
        setAdding(true);
        try {
            const body: Record<string, string> = { accountName: newAccountName.trim(), accountType: newAccountType };
            if (newLinkedinUrl.trim()) body.linkedinUrl = newLinkedinUrl.trim();
            const res = await fetch("/api/linkedin-accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            if (!res.ok) throw new Error("Failed to create account");
            toast.success("LinkedIn account added");
            setShowAddModal(false);
            setNewAccountName("");
            setNewAccountType("basic");
            setNewLinkedinUrl("");
            await fetchAccounts();
        } catch {
            toast.error("Failed to add account");
        } finally {
            setAdding(false);
        }
    }

    /** Delete a LinkedIn account via API. */
    async function handleDeleteAccount(id: string): Promise<void> {
        try {
            const res = await fetch(`/api/linkedin-accounts/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Account removed");
            setAccounts((prev) => prev.filter((a) => a.id !== id));
        } catch {
            toast.error("Failed to remove account");
        }
    }

    /** Persist warmup toggle via API. */
    async function toggleWarmup(id: string): Promise<void> {
        const row = accounts.find((a) => a.id === id);
        if (!row) return;
        const newEnabled = !row.warmupEnabled;
        setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, warmupEnabled: newEnabled } : a)));
        try {
            await fetch(`/api/linkedin-accounts/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dailyConnectionLimit: newEnabled ? 10 : 20 }),
            });
        } catch {
            setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, warmupEnabled: !newEnabled } : a)));
            toast.error("Failed to update warmup setting");
        }
    }

    const summary = useMemo(() => {
        const healthAverage = accounts.length > 0 ? Math.round(accounts.reduce((sum, row) => sum + row.healthScore, 0) / accounts.length) : 0;
        const connectedCount = accounts.filter((row) => row.status === "connected").length;
        const warmupCount = accounts.filter((row) => row.warmupEnabled).length;
        const proxyCount = accounts.filter((row) => row.proxyConfigured).length;

        return { healthAverage, connectedCount, warmupCount, proxyCount };
    }, [accounts]);

    if (loading) return <div className="flex h-96 items-center justify-center"><p className="text-sm text-[var(--text-muted)]">Loading accounts…</p></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">LinkedIn Accounts</h1>
                    <p className="text-sm text-[var(--text-secondary)]">Manage sender accounts, usage, sync status and health</p>
                </div>

                <Button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400">
                    <Plus className="mr-2 h-4 w-4" />
                    Add LinkedIn Account
                </Button>
            </div>

            {/* Add Account Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl border border-white/10 bg-[var(--bg-card)] p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Add LinkedIn Account</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-[var(--text-muted)] hover:text-white"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Account Name</label>
                                <input value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} placeholder="e.g. John Doe" className="w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-purple-500" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Account Type</label>
                                <select value={newAccountType} onChange={(e) => setNewAccountType(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-purple-500">
                                    <option value="basic">Basic</option>
                                    <option value="premium">Premium</option>
                                    <option value="sales_navigator">Sales Navigator</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">LinkedIn URL (optional)</label>
                                <input value={newLinkedinUrl} onChange={(e) => setNewLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-purple-500" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="ghost" onClick={() => setShowAddModal(false)} className="text-[var(--text-secondary)]">Cancel</Button>
                                <Button onClick={handleAddAccount} disabled={adding || !newAccountName.trim()} className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400">
                                    {adding ? "Adding…" : "Add Account"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm" className="h-8 border border-white/10 bg-[var(--bg-input)] px-3 text-xs text-[var(--text-secondary)] hover:bg-white/10 hover:text-white">
                                                    Manage
                                                </Button>
                                                <button onClick={() => handleDeleteAccount(row.id)} aria-label="Delete account" className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-[var(--bg-input)] text-[var(--text-muted)] transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
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
