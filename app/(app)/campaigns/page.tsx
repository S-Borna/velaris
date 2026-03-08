// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Copy, MoreHorizontal, Plus, Search, Trash2, TrendingUp, Megaphone } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { toast } from "sonner";

type CampaignStatus = "active" | "paused" | "draft" | "completed" | "archived";

interface CampaignRow {
    id: string;
    name: string;
    status: CampaignStatus;
    created: string;
    connectionsSent: number;
    connectionsAccepted: number;
    messagesSent: number;
    replyRate: number;
    opportunities: number;
}

interface CampaignGrade {
    letter: string;
    color: string;
    bg: string;
    trend: "up" | "down" | "stable";
}

const MOCK_CAMPAIGNS: CampaignRow[] = [
    { id: "c1", name: "Outreach to Agency Owners", status: "active", created: "2026-02-14", connectionsSent: 1240, connectionsAccepted: 632, messagesSent: 1162, replyRate: 24, opportunities: 12 },
    { id: "c2", name: "SaaS Founders Europe", status: "active", created: "2026-02-20", connectionsSent: 890, connectionsAccepted: 445, messagesSent: 712, replyRate: 18, opportunities: 8 },
    { id: "c3", name: "B2B Decision Makers", status: "paused", created: "2026-02-28", connectionsSent: 320, connectionsAccepted: 160, messagesSent: 280, replyRate: 22, opportunities: 5 },
    { id: "c4", name: "Marketing Directors DACH", status: "draft", created: "2026-03-01", connectionsSent: 0, connectionsAccepted: 0, messagesSent: 0, replyRate: 0, opportunities: 0 },
    { id: "c5", name: "Series A Startups", status: "completed", created: "2026-01-15", connectionsSent: 2100, connectionsAccepted: 1050, messagesSent: 1890, replyRate: 28, opportunities: 22 },
    { id: "c6", name: "HR Tech Buyers", status: "active", created: "2026-03-03", connectionsSent: 180, connectionsAccepted: 90, messagesSent: 140, replyRate: 15, opportunities: 2 },
    { id: "c7", name: "E-commerce Heads Nordics", status: "paused", created: "2026-02-10", connectionsSent: 560, connectionsAccepted: 280, messagesSent: 450, replyRate: 20, opportunities: 7 },
    { id: "c8", name: "VP Sales US Tech", status: "draft", created: "2026-03-05", connectionsSent: 0, connectionsAccepted: 0, messagesSent: 0, replyRate: 0, opportunities: 0 },
];

const STATUS_OPTIONS: { value: CampaignStatus | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "paused", label: "Paused" },
    { value: "draft", label: "Draft" },
    { value: "completed", label: "Completed" },
];

const PAGE_SIZE = 5;

type SortKey = "name" | "connectionsSent" | "connectionsAccepted" | "messagesSent" | "replyRate" | "opportunities";

function StatusBadge({ status }: { status: CampaignStatus }) {
    const styles: Record<CampaignStatus, string> = {
        active: "border-green-500/30 bg-green-500/15 text-green-300",
        paused: "border-amber-500/30 bg-amber-500/15 text-amber-300",
        draft: "border-white/15 bg-white/5 text-[var(--text-secondary)]",
        completed: "border-blue-500/30 bg-blue-500/15 text-blue-300",
        archived: "border-white/10 bg-white/5 text-[var(--text-muted)]",
    };
    return <Badge className={`border ${styles[status]}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

function PerformanceBadge({ rate }: { rate: number }) {
    if (rate >= 25) return <span className="text-green-400 font-medium">{rate}%</span>;
    if (rate >= 15) return <span className="text-amber-400 font-medium">{rate}%</span>;
    return <span className="text-[var(--text-secondary)]">{rate}%</span>;
}

/** Returns a letter grade, colors, and trend direction for campaign performance. */
function getCampaignGrade(row: CampaignRow): CampaignGrade {
    if (row.status === "draft") return { letter: "—", color: "text-[var(--text-muted)]", bg: "bg-white/5 border-white/10", trend: "stable" };
    const acceptRate = row.connectionsSent > 0 ? row.connectionsAccepted / row.connectionsSent : 0;
    const score = row.replyRate * 0.5 + acceptRate * 100 * 0.3 + Math.min(row.opportunities, 20) * 1;
    if (score >= 25) return { letter: "A", color: "text-green-300", bg: "bg-green-500/15 border-green-500/30", trend: "up" };
    if (score >= 18) return { letter: "B", color: "text-blue-300", bg: "bg-blue-500/15 border-blue-500/30", trend: "up" };
    if (score >= 10) return { letter: "C", color: "text-amber-300", bg: "bg-amber-500/15 border-amber-500/30", trend: "stable" };
    return { letter: "D", color: "text-red-300", bg: "bg-red-500/15 border-red-500/30", trend: "down" };
}

function SortHeader({ label, sortKey: key, current, asc, onSort }: { label: string; sortKey: SortKey; current: SortKey; asc: boolean; onSort: (k: SortKey) => void }) {
    const isActive = current === key;
    return (
        <th className="px-3 py-3 font-medium">
            <button type="button" onClick={() => onSort(key)} className="flex items-center gap-1 hover:text-[var(--text-primary)] transition">
                {label}
                <ArrowUpDown className={`h-3 w-3 ${isActive ? "text-purple-400" : ""}`} />
                {isActive && <span className="text-[10px] text-purple-400">{asc ? "↑" : "↓"}</span>}
            </button>
        </th>
    );
}

export default function CampaignsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");
    const [sortKey, setSortKey] = useState<SortKey>("connectionsSent");
    const [sortAsc, setSortAsc] = useState(false);
    const [page, setPage] = useState(0);
    const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    /** Map from client sort keys to API column names */
    const SORT_MAP: Record<SortKey, string> = useMemo(() => ({
        name: "name",
        connectionsSent: "connectionsSent",
        connectionsAccepted: "connectionsAccepted",
        messagesSent: "messagesSent",
        replyRate: "repliesReceived",
        opportunities: "opportunitiesValue",
    }), []);

    const mapRow = useCallback((c: Record<string, unknown>): CampaignRow => ({
        id: String(c.id),
        name: String(c.name),
        status: String(c.status) as CampaignStatus,
        created: String(c.createdAt).slice(0, 10),
        connectionsSent: Number(c.connectionsSent) || 0,
        connectionsAccepted: Number(c.connectionsAccepted) || 0,
        messagesSent: Number(c.messagesSent) || 0,
        replyRate: Number(c.messagesSent) > 0
            ? Math.round((Number(c.repliesReceived) / Number(c.messagesSent)) * 100)
            : 0,
        opportunities: Math.round(Number(c.opportunitiesValue) / 4000) || 0,
    }), []);

    const fetchCampaigns = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("pageSize", String(PAGE_SIZE));
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (searchQuery.trim()) params.set("search", searchQuery.trim());
            params.set("sort", SORT_MAP[sortKey]);
            params.set("order", sortAsc ? "asc" : "desc");

            const res = await fetch(`/api/campaigns?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json() as { data: Record<string, unknown>[]; totalPages?: number };
            setCampaigns((json.data ?? []).map(mapRow));
            setTotalPages(json.totalPages ?? 1);
        } catch {
            setCampaigns(MOCK_CAMPAIGNS);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [mapRow, page, statusFilter, searchQuery, sortKey, sortAsc, SORT_MAP]);

    useEffect(() => { void fetchCampaigns(); }, [fetchCampaigns]);

    async function handleDelete(row: CampaignRow): Promise<void> {
        setCampaigns((prev) => prev.filter((c) => c.id !== row.id));
        try {
            const res = await fetch(`/api/campaigns/${row.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            toast.success(`"${row.name}" deleted`);
        } catch {
            toast.error("Failed to delete campaign");
            void fetchCampaigns();
        }
    }

    async function handleDuplicate(row: CampaignRow): Promise<void> {
        try {
            const res = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: `${row.name} (Copy)` }),
            });
            if (!res.ok) throw new Error("Duplicate failed");
            toast.success(`"${row.name}" duplicated`);
            void fetchCampaigns();
        } catch {
            toast.error("Failed to duplicate campaign");
        }
    }

    function handleSort(key: SortKey): void {
        if (sortKey === key) { setSortAsc((p) => !p); } else { setSortKey(key); setSortAsc(false); }
        setPage(0);
    }

    if (loading) return <div className="flex h-96 items-center justify-center"><p className="text-sm text-[var(--text-muted)]">Loading campaigns…</p></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">Campaigns</h1>
                    <p className="text-sm text-[var(--text-secondary)]">{campaigns.length} campaigns total</p>
                </div>
                <Link href="/campaigns/new">
                    <Button className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400">
                        <Plus className="mr-2 h-4 w-4" /> Create new Campaign
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input type="text" placeholder="Search campaigns..." value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                        aria-label="Search campaigns"
                        className="h-10 w-full rounded-lg border border-white/10 bg-[var(--bg-input)] pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                </div>
                <div className="flex gap-2">
                    {STATUS_OPTIONS.map((opt) => (
                        <button key={opt.value} type="button" onClick={() => { setStatusFilter(opt.value); setPage(0); }}
                            className={`rounded-lg border px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 ${statusFilter === opt.value ? "border-purple-500/50 bg-purple-500/15 text-purple-300" : "border-white/10 bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-white/10"}`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
                                <th className="px-3 py-3 font-medium">Campaign</th>
                                <th className="px-3 py-3 font-medium">Status</th>
                                <th className="px-3 py-3 font-medium">Created</th>
                                <SortHeader label="Conn. Sent" sortKey="connectionsSent" current={sortKey} asc={sortAsc} onSort={handleSort} />
                                <SortHeader label="Conn. Accepted" sortKey="connectionsAccepted" current={sortKey} asc={sortAsc} onSort={handleSort} />
                                <SortHeader label="Msg. Sent" sortKey="messagesSent" current={sortKey} asc={sortAsc} onSort={handleSort} />
                                <SortHeader label="Reply Rate" sortKey="replyRate" current={sortKey} asc={sortAsc} onSort={handleSort} />
                                <SortHeader label="Opportunities" sortKey="opportunities" current={sortKey} asc={sortAsc} onSort={handleSort} />
                                <th className="px-3 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map((row) => {
                                const grade = getCampaignGrade(row);
                                return (
                                <tr key={row.id} className="border-b border-white/6 text-[var(--text-primary)] hover:bg-white/[0.02]">
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-2">
                                            <Link href={`/campaigns/${row.id}`} className="font-medium hover:text-purple-300 transition">{row.name}</Link>
                                            <span className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-bold ${grade.bg} ${grade.color}`}>
                                                {grade.letter}
                                                {grade.trend === "up" && <TrendingUp className="h-2.5 w-2.5" />}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3"><StatusBadge status={row.status} /></td>
                                    <td className="px-3 py-3 text-[var(--text-secondary)]">{row.created}</td>
                                    <td className="px-3 py-3">{row.connectionsSent.toLocaleString()}</td>
                                    <td className="px-3 py-3">{row.connectionsAccepted.toLocaleString()}</td>
                                    <td className="px-3 py-3">{row.messagesSent.toLocaleString()}</td>
                                    <td className="px-3 py-3"><PerformanceBadge rate={row.replyRate} /></td>
                                    <td className="px-3 py-3">{row.opportunities}</td>
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-1">
                                            <button type="button" title="Duplicate" onClick={() => void handleDuplicate(row)} className="rounded p-1.5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition"><Copy className="h-3.5 w-3.5" /></button>
                                            <button type="button" title="Delete" onClick={() => void handleDelete(row)} className="rounded p-1.5 text-[var(--text-secondary)] hover:bg-red-500/15 hover:text-red-400 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                                            <button type="button" title="More" className="rounded p-1.5 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                            {campaigns.length === 0 && <tr><td colSpan={9}><EmptyState icon={Megaphone} title="No campaigns yet" description="Create your first campaign to start reaching leads on LinkedIn." actionLabel="Create Campaign" actionHref="/campaigns/new" /></td></tr>}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                        <p className="text-xs text-[var(--text-secondary)]">Page {page + 1} of {totalPages}</p>
                        <div className="flex gap-2">
                            <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-white/10 bg-[var(--bg-input)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-white/10 disabled:opacity-40">Previous</button>
                            <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-white/10 bg-[var(--bg-input)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-white/10 disabled:opacity-40">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
