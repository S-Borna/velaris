// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import {
    ArrowUpDown,
    Copy,
    Megaphone,
    Plus,
    Search,
    Trash2,
    TrendingUp,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────

type StatusFilter = "all" | "draft" | "active" | "paused" | "completed" | "archived";
type SortKey =
    | "name"
    | "createdAt"
    | "connectionsSent"
    | "connectionsAccepted"
    | "messagesSent"
    | "replyRate"
    | "opportunitiesValue";
type SortOrder = "asc" | "desc";

interface CampaignRow {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    connectionsSent: number;
    connectionsAccepted: number;
    messagesSent: number;
    repliesReceived: number;
    opportunitiesValue: number;
    totalLeads: number;
}

// ─── Constants ──────────────────────────────────────────

const STATUS_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Paused", value: "paused" },
    { label: "Draft", value: "draft" },
    { label: "Completed", value: "completed" },
];

const PAGE_SIZE = 10;

const STATUS_BADGE_COLORS: Record<string, string> = {
    active: "border-green-500/30 bg-green-500/10 text-green-300",
    paused: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    draft: "border-white/10 bg-white/5 text-[var(--text-secondary)]",
    completed: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    archived: "border-white/10 bg-white/5 text-[var(--text-muted)]",
};

// ─── Helpers ────────────────────────────────────────────

function getReplyRate(row: CampaignRow): number {
    if (row.messagesSent === 0) return 0;
    return Math.round((row.repliesReceived / row.messagesSent) * 100);
}

function getCampaignGrade(row: CampaignRow): {
    grade: string;
    color: string;
} {
    const rate = getReplyRate(row);
    if (rate >= 25) {
        return { grade: "A", color: "text-green-400 bg-green-500/10 border-green-500/30" };
    }
    if (rate >= 15) {
        return { grade: "B", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" };
    }
    if (rate >= 8) {
        return { grade: "C", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" };
    }
    return { grade: "D", color: "text-red-400 bg-red-500/10 border-red-500/30" };
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

// ─── Sub-Components ─────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const colors = STATUS_BADGE_COLORS[status] ?? STATUS_BADGE_COLORS.draft;
    return (
        <Badge className={`text-[10px] ${colors}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    );
}

function PerformanceBadge({ row }: { row: CampaignRow }) {
    const { grade, color } = getCampaignGrade(row);
    return (
        <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded border text-xs font-bold ${color}`}
        >
            {grade}
        </span>
    );
}

function SortHeader({
    label,
    sortKey: key,
    currentKey,
    onSort,
}: {
    label: string;
    sortKey: SortKey;
    currentKey: SortKey;
    currentOrder: SortOrder;
    onSort: (key: SortKey) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onSort(key)}
            className="inline-flex items-center gap-1 transition-colors hover:text-white"
        >
            {label}
            <ArrowUpDown
                className={`h-3 w-3 ${currentKey === key ? "text-purple-400" : ""}`}
            />
        </button>
    );
}

// ─── Main Component ─────────────────────────────────────

export default function CampaignsPage() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [sortKey, setSortKey] = useState<SortKey>("createdAt");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [page, setPage] = useState(1);

    const [rows, setRows] = useState<CampaignRow[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchCampaigns = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                pageSize: String(PAGE_SIZE),
            });
            if (search) params.set("search", search);
            if (statusFilter !== "all") params.set("status", statusFilter);

            const res = await fetch(`/api/campaigns?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            const result = json.data;

            setRows(
                result.data.map(
                    (c: {
                        id: string;
                        name: string;
                        status: string;
                        createdAt: string;
                        connectionsSent: number;
                        connectionsAccepted: number;
                        messagesSent: number;
                        repliesReceived: number;
                        opportunitiesValue: number | string;
                        totalLeads: number;
                    }) => ({
                        id: c.id,
                        name: c.name,
                        status: c.status,
                        createdAt: c.createdAt,
                        connectionsSent: c.connectionsSent ?? 0,
                        connectionsAccepted: c.connectionsAccepted ?? 0,
                        messagesSent: c.messagesSent ?? 0,
                        repliesReceived: c.repliesReceived ?? 0,
                        opportunitiesValue: Number(c.opportunitiesValue ?? 0),
                        totalLeads: c.totalLeads ?? 0,
                    }),
                ),
            );
            setTotal(result.total);
            setTotalPages(result.totalPages);
        } catch {
            setRows([]);
            setTotal(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [search, statusFilter]);

    // Local sorting
    const sortedRows = useMemo(() => {
        const sorted = [...rows].sort((a, b) => {
            let aVal: number | string;
            let bVal: number | string;

            if (sortKey === "name") {
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
            } else if (sortKey === "createdAt") {
                aVal = new Date(a.createdAt).getTime();
                bVal = new Date(b.createdAt).getTime();
            } else if (sortKey === "replyRate") {
                aVal = getReplyRate(a);
                bVal = getReplyRate(b);
            } else {
                aVal = a[sortKey];
                bVal = b[sortKey];
            }

            if (aVal < bVal) return -1;
            if (aVal > bVal) return 1;
            return 0;
        });
        if (sortOrder === "desc") sorted.reverse();
        return sorted;
    }, [rows, sortKey, sortOrder]);

    function toggleSort(key: SortKey): void {
        if (sortKey === key) {
            setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortOrder("desc");
        }
    }

    async function handleDuplicate(id: string): Promise<void> {
        try {
            const res = await fetch(`/api/campaigns/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "duplicate" }),
            });
            if (res.ok) fetchCampaigns();
        } catch {
            // Silent fail
        }
    }

    async function handleDelete(id: string): Promise<void> {
        try {
            const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
            if (res.ok) fetchCampaigns();
        } catch {
            // Silent fail
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        Campaigns
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        {total} campaign{total !== 1 ? "s" : ""}
                    </p>
                </div>
                <Link href="/campaigns/new">
                    <Button className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400">
                        <Plus className="mr-2 h-4 w-4" />
                        Create new Campaign
                    </Button>
                </Link>
            </div>

            {/* Search + Status Filter */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search campaigns..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-[var(--bg-input)] py-2 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-purple-500/50 focus:outline-none"
                    />
                </div>
                <div className="flex gap-1.5 rounded-lg border border-white/10 bg-[var(--bg-input)] p-1">
                    {STATUS_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setStatusFilter(opt.value)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                                statusFilter === opt.value
                                    ? "bg-purple-500 text-white"
                                    : "text-[var(--text-secondary)] hover:bg-white/5"
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="animate-pulse rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex gap-4">
                                {Array.from({ length: 8 }).map((_, j) => (
                                    <div
                                        key={j}
                                        className="h-5 flex-1 rounded bg-white/10"
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            ) : rows.length === 0 ? (
                <EmptyState
                    icon={Megaphone}
                    title="No campaigns yet"
                    description="Create your first campaign to start reaching out to leads."
                />
            ) : (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)]">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
                                    <th className="px-4 py-3 font-medium">
                                        <SortHeader
                                            label="Campaign"
                                            sortKey="name"
                                            currentKey={sortKey}
                                            currentOrder={sortOrder}
                                            onSort={toggleSort}
                                        />
                                    </th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">
                                        <SortHeader
                                            label="Created"
                                            sortKey="createdAt"
                                            currentKey={sortKey}
                                            currentOrder={sortOrder}
                                            onSort={toggleSort}
                                        />
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        <SortHeader
                                            label="Conn. Sent"
                                            sortKey="connectionsSent"
                                            currentKey={sortKey}
                                            currentOrder={sortOrder}
                                            onSort={toggleSort}
                                        />
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        <SortHeader
                                            label="Accepted"
                                            sortKey="connectionsAccepted"
                                            currentKey={sortKey}
                                            currentOrder={sortOrder}
                                            onSort={toggleSort}
                                        />
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        <SortHeader
                                            label="Msgs Sent"
                                            sortKey="messagesSent"
                                            currentKey={sortKey}
                                            currentOrder={sortOrder}
                                            onSort={toggleSort}
                                        />
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        <SortHeader
                                            label="Reply %"
                                            sortKey="replyRate"
                                            currentKey={sortKey}
                                            currentOrder={sortOrder}
                                            onSort={toggleSort}
                                        />
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        <SortHeader
                                            label="Opp. $"
                                            sortKey="opportunitiesValue"
                                            currentKey={sortKey}
                                            currentOrder={sortOrder}
                                            onSort={toggleSort}
                                        />
                                    </th>
                                    <th className="px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b border-white/6 text-[var(--text-primary)] transition-colors hover:bg-white/[0.02]"
                                    >
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/campaigns/${row.id}`}
                                                className="flex items-center gap-2 hover:text-purple-300"
                                            >
                                                <PerformanceBadge row={row} />
                                                <span className="font-medium">{row.name}</span>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={row.status} />
                                        </td>
                                        <td className="px-4 py-3 text-[var(--text-secondary)]">
                                            {formatDate(row.createdAt)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.connectionsSent.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.connectionsAccepted.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            {row.messagesSent.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <TrendingUp className="mr-1 inline h-3 w-3 text-green-400" />
                                            {getReplyRate(row)}%
                                        </td>
                                        <td className="px-4 py-3 text-cyan-300">
                                            ${Number(row.opportunitiesValue).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDuplicate(row.id)}
                                                    className="rounded p-1 transition-colors hover:bg-white/10"
                                                    title="Duplicate"
                                                >
                                                    <Copy className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(row.id)}
                                                    className="rounded p-1 transition-colors hover:bg-red-500/10"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-[var(--text-secondary)] hover:text-red-400" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-sm text-[var(--text-secondary)]">
                            <span>
                                Page {page} of {totalPages} ({total} total)
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="border-white/10 text-xs"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="border-white/10 text-xs"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
