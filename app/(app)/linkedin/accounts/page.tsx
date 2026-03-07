// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { Linkedin, Loader2, Plus, RefreshCw } from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */

type AccountStatus = "connected" | "disconnected" | "syncing" | "error";

interface LinkedInAccountRow {
    id: string;
    accountName: string;
    status: AccountStatus;
    accountType: string;
    linkedinUrl: string | null;
    dailyConnectionLimit: number;
    dailyMessageLimit: number;
    dailyConnectionsUsed: number;
    dailyMessagesUsed: number;
    proxyUrl: string | null;
    lastSyncAt: string | null;
    createdAt: string;
}

/* ─── Sub-components ────────────────────────────────── */

function StatusBadge({ status }: { status: AccountStatus }) {
    const styles: Record<AccountStatus, { cls: string; label: string }> = {
        connected: { cls: "border-green-500/30 bg-green-500/15 text-green-300", label: "Connected" },
        syncing: { cls: "border-amber-500/30 bg-amber-500/15 text-amber-300", label: "Syncing" },
        error: { cls: "border-red-500/30 bg-red-500/15 text-red-300", label: "Error" },
        disconnected: { cls: "border-white/15 bg-white/5 text-[var(--text-secondary)]", label: "Disconnected" },
    };
    const s = styles[status] ?? styles.disconnected;
    return <Badge className={`border ${s.cls}`}>{s.label}</Badge>;
}

function formatSyncTime(iso: string | null): string {
    if (!iso) return "Never";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

/* ─── Main Component ────────────────────────────────── */

export default function LinkedInAccountsPage() {
    const [accounts, setAccounts] = useState<LinkedInAccountRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [addName, setAddName] = useState("");
    const [addType, setAddType] = useState("basic");
    const [saving, setSaving] = useState(false);

    const fetchAccounts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/linkedin-accounts");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            setAccounts(json.data?.data ?? json.data ?? []);
        } catch {
            setAccounts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const summary = useMemo(() => {
        const connectedCount = accounts.filter((a) => a.status === "connected").length;
        const proxyCount = accounts.filter((a) => a.proxyUrl).length;
        const totalMsgUsed = accounts.reduce((s, a) => s + a.dailyMessagesUsed, 0);
        const totalMsgLimit = accounts.reduce((s, a) => s + a.dailyMessageLimit, 0);
        return { connectedCount, proxyCount, totalMsgUsed, totalMsgLimit };
    }, [accounts]);

    async function handleAdd(): Promise<void> {
        if (!addName.trim()) return;
        setSaving(true);
        try {
            await fetch("/api/linkedin-accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accountName: addName.trim(),
                    accountType: addType,
                }),
            });
            setAddName("");
            setShowAddForm(false);
            fetchAccounts();
        } catch {
            // Silent
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string): Promise<void> {
        if (!confirm("Remove this LinkedIn account?")) return;
        try {
            await fetch(`/api/linkedin-accounts/${id}`, { method: "DELETE" });
            fetchAccounts();
        } catch {
            // Silent
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        LinkedIn Accounts
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Manage sender accounts, usage, sync status and health
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchAccounts}
                        className="border-white/10"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add LinkedIn Account
                    </Button>
                </div>
            </div>

            {/* Add form */}
            {showAddForm && (
                <div className="rounded-xl border border-purple-500/20 bg-[var(--bg-card)] p-5">
                    <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                        Add New Account
                    </h3>
                    <div className="grid gap-3 md:grid-cols-3">
                        <div>
                            <label
                                htmlFor="account-name"
                                className="mb-1 block text-xs text-[var(--text-secondary)]"
                            >
                                Account Name
                            </label>
                            <input
                                id="account-name"
                                type="text"
                                value={addName}
                                onChange={(e) => setAddName(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-purple-500/50 focus:outline-none"
                                placeholder="e.g., Said Borna"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="account-type"
                                className="mb-1 block text-xs text-[var(--text-secondary)]"
                            >
                                Account Type
                            </label>
                            <select
                                id="account-type"
                                value={addType}
                                onChange={(e) => setAddType(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-purple-500/50 focus:outline-none"
                            >
                                <option value="basic">Basic</option>
                                <option value="premium">Premium</option>
                                <option value="sales_navigator">Sales Navigator</option>
                            </select>
                        </div>
                        <div className="flex items-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAddForm(false)}
                                className="border-white/10"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleAdd}
                                disabled={!addName.trim() || saving}
                                className="bg-purple-500/90 text-white hover:bg-purple-500"
                            >
                                {saving ? (
                                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                                ) : null}
                                Add
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-4 transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                        Total Accounts
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                        {accounts.length}
                    </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-4 transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                        Connected
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-green-400">
                        {summary.connectedCount}
                    </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-4 transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                        Daily Messages
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                        {summary.totalMsgUsed} / {summary.totalMsgLimit}
                    </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-4 transition-all duration-200 hover:border-white/20 hover:-translate-y-0.5">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                        Proxy Configured
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                        {summary.proxyCount}
                    </p>
                </div>
            </div>

            {/* Accounts table */}
            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-16 animate-pulse rounded-xl bg-white/5"
                        />
                    ))}
                </div>
            ) : accounts.length === 0 ? (
                <EmptyState
                    icon={Linkedin}
                    title="No LinkedIn accounts"
                    description="Add a LinkedIn account to start automating outreach."
                />
            ) : (
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                    <div className="mb-4 flex items-center gap-2 text-[var(--text-secondary)]">
                        <Linkedin className="h-4 w-4" />
                        <span className="text-sm">
                            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
                                    <th className="px-3 py-3 font-medium">Account</th>
                                    <th className="px-3 py-3 font-medium">Status</th>
                                    <th className="px-3 py-3 font-medium">Type</th>
                                    <th className="px-3 py-3 font-medium">
                                        Daily Messages
                                    </th>
                                    <th className="px-3 py-3 font-medium">
                                        Daily Connections
                                    </th>
                                    <th className="px-3 py-3 font-medium">Proxy</th>
                                    <th className="px-3 py-3 font-medium">Last Sync</th>
                                    <th className="px-3 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((row) => {
                                    const msgPct = row.dailyMessageLimit
                                        ? Math.round(
                                              (row.dailyMessagesUsed /
                                                  row.dailyMessageLimit) *
                                                  100,
                                          )
                                        : 0;
                                    const connPct = row.dailyConnectionLimit
                                        ? Math.round(
                                              (row.dailyConnectionsUsed /
                                                  row.dailyConnectionLimit) *
                                                  100,
                                          )
                                        : 0;

                                    return (
                                        <tr
                                            key={row.id}
                                            className="border-b border-white/6 text-[var(--text-primary)] transition-colors hover:bg-white/[0.02]"
                                        >
                                            <td className="px-3 py-3 font-medium">
                                                {row.accountName}
                                            </td>
                                            <td className="px-3 py-3">
                                                <StatusBadge status={row.status} />
                                            </td>
                                            <td className="px-3 py-3 text-[var(--text-secondary)]">
                                                {row.accountType === "sales_navigator"
                                                    ? "Sales Nav"
                                                    : row.accountType === "premium"
                                                      ? "Premium"
                                                      : "Basic"}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="w-32">
                                                    <p className="mb-1 text-xs text-[var(--text-secondary)]">
                                                        {row.dailyMessagesUsed} /{" "}
                                                        {row.dailyMessageLimit}
                                                    </p>
                                                    <div className="h-1.5 rounded-full bg-white/10">
                                                        <div
                                                            className="h-1.5 rounded-full bg-purple-500"
                                                            style={{
                                                                width: `${Math.min(msgPct, 100)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="w-32">
                                                    <p className="mb-1 text-xs text-[var(--text-secondary)]">
                                                        {row.dailyConnectionsUsed} /{" "}
                                                        {row.dailyConnectionLimit}
                                                    </p>
                                                    <div className="h-1.5 rounded-full bg-white/10">
                                                        <div
                                                            className="h-1.5 rounded-full bg-blue-500"
                                                            style={{
                                                                width: `${Math.min(connPct, 100)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                {row.proxyUrl ? (
                                                    <Badge className="border border-cyan-500/30 bg-cyan-500/15 text-cyan-300">
                                                        Configured
                                                    </Badge>
                                                ) : (
                                                    <Badge className="border border-white/15 bg-white/5 text-[var(--text-secondary)]">
                                                        Not Set
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-[var(--text-secondary)]">
                                                {formatSyncTime(row.lastSyncAt)}
                                            </td>
                                            <td className="px-3 py-3">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(row.id)}
                                                    className="h-8 border border-white/10 bg-[var(--bg-input)] px-3 text-xs text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-300"
                                                >
                                                    Remove
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
