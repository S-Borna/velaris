// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { LeadFilterPanel, EMPTY_FILTERS, type LeadFilters } from "@/components/leads/lead-filters";
import { LeadTable, type LeadRow, type SortKey } from "@/components/leads/lead-table";
import {
    Database,
    Download,
    LayoutGrid,
    LayoutList,
    Search,
    Users,
} from "lucide-react";

// ─── Constants ──────────────────────────────────────────

const PAGE_SIZE = 25;
const VIEW_TABLE = "table" as const;
const VIEW_GRID = "grid" as const;
type ViewMode = typeof VIEW_TABLE | typeof VIEW_GRID;

// ─── Helpers ────────────────────────────────────────────

function getIcpBadge(score: number | null): { label: string; color: string } {
    if (score === null) return { label: "—", color: "text-[var(--text-muted)]" };
    if (score >= 80) return { label: `${score}`, color: "text-green-400 bg-green-500/10 border-green-500/30" };
    if (score >= 60) return { label: `${score}`, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" };
    return { label: `${score}`, color: "text-red-400 bg-red-500/10 border-red-500/30" };
}

// ─── Main Component ─────────────────────────────────────

export default function LeadDatabasePage() {
    const [filters, setFilters] = useState<LeadFilters>(EMPTY_FILTERS);
    const [searchQuery, setSearchQuery] = useState("");
    const [view, setView] = useState<ViewMode>(VIEW_TABLE);
    const [page, setPage] = useState(1);
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    const [leads, setLeads] = useState<LeadRow[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                pageSize: String(PAGE_SIZE),
            });

            const combinedSearch = [searchQuery, filters.search].filter(Boolean).join(" ");
            if (combinedSearch) params.set("search", combinedSearch);
            if (filters.locations.length > 0) params.set("location", filters.locations[0]);
            if (filters.industries.length > 0) params.set("industry", filters.industries[0]);
            if (filters.companySizes.length > 0) params.set("company", filters.companySizes[0]);

            const res = await fetch(`/api/leads?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            const result = json.data;

            setLeads(
                result.data.map(
                    (l: {
                        id: string;
                        firstName: string | null;
                        lastName: string | null;
                        title: string | null;
                        company: string | null;
                        location: string | null;
                        email: string | null;
                        phone: string | null;
                        linkedinUrl: string | null;
                        avatarUrl: string | null;
                        icpScore: number | null;
                        source: string | null;
                        tags: string[] | null;
                    }) => ({
                        id: l.id,
                        firstName: l.firstName ?? "",
                        lastName: l.lastName ?? "",
                        title: l.title ?? "",
                        company: l.company ?? "",
                        companyLogo: "",
                        location: l.location ?? "",
                        email: l.email,
                        phone: l.phone,
                        linkedinUrl: l.linkedinUrl ?? "",
                        avatarUrl: l.avatarUrl ?? "",
                        icpScore: l.icpScore,
                        source: (l.source as LeadRow["source"]) ?? "database",
                        tags: l.tags ?? [],
                    }),
                ),
            );
            setTotal(result.total);
        } catch {
            setLeads([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery, filters]);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    // Reset page when filters/search change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, filters]);

    // Local sorting (API doesn't support sort params currently)
    const sortedLeads = useMemo(() => {
        const sorted = [...leads].sort((a, b) => {
            let aVal: string | number;
            let bVal: string | number;

            if (sortKey === "name") {
                aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
                bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
            } else if (sortKey === "icpScore") {
                aVal = a.icpScore ?? -1;
                bVal = b.icpScore ?? -1;
            } else {
                aVal = (a[sortKey] ?? "").toLowerCase();
                bVal = (b[sortKey] ?? "").toLowerCase();
            }

            if (aVal < bVal) return -1;
            if (aVal > bVal) return 1;
            return 0;
        });
        if (sortDir === "desc") sorted.reverse();
        return sorted;
    }, [leads, sortKey, sortDir]);

    function handleSort(key: SortKey): void {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    }

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const activeFilterCount = Object.values(filters).filter(
        (v) => (Array.isArray(v) ? v.length > 0 : v !== ""),
    ).length;

    return (
        <div className="flex gap-6">
            {/* Filter Sidebar */}
            <LeadFilterPanel filters={filters} onChange={setFilters} />

            {/* Main Content */}
            <div className="flex-1 space-y-4">
                {/* Top Bar */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                            Lead Database
                        </h1>
                        <Badge className="border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[10px]">
                            Advanced Lead Search
                        </Badge>
                        {activeFilterCount > 0 && (
                            <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-[10px]">
                                {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex rounded-md border border-white/10 bg-[var(--bg-input)]">
                            <button
                                type="button"
                                onClick={() => setView(VIEW_TABLE)}
                                className={`p-2 transition ${view === VIEW_TABLE ? "bg-white/10 text-white" : "text-[var(--text-secondary)]"}`}
                                aria-label="Table view"
                            >
                                <LayoutList className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setView(VIEW_GRID)}
                                className={`p-2 transition ${view === VIEW_GRID ? "bg-white/10 text-white" : "text-[var(--text-secondary)]"}`}
                                aria-label="Grid view"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-white/10 text-xs"
                        >
                            <Download className="mr-1 h-3.5 w-3.5" /> Export Data
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search leads by name, company, title..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-[var(--bg-input)] py-2 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-purple-500/50 focus:outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <span>Set Filters</span>
                        <span className="text-[var(--text-muted)]">→</span>
                        <span>Search Leads</span>
                        <span className="text-[var(--text-muted)]">→</span>
                        <span>Export Data</span>
                    </div>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="animate-pulse rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                        <div className="space-y-3">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="flex gap-4">
                                    {Array.from({ length: 5 }).map((_, j) => (
                                        <div key={j} className="h-5 flex-1 rounded bg-white/10" />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : leads.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="No leads found"
                        description="Try adjusting your filters or search query."
                    />
                ) : view === VIEW_GRID ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {sortedLeads.map((lead) => {
                            const icp = getIcpBadge(lead.icpScore);
                            return (
                                <div
                                    key={lead.id}
                                    className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-4 transition hover:border-white/20"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-sm font-bold text-purple-300">
                                            {lead.firstName.charAt(0)}
                                            {lead.lastName.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-[var(--text-primary)]">
                                                {lead.firstName} {lead.lastName}
                                            </p>
                                            <p className="text-xs text-[var(--text-secondary)]">
                                                {lead.title}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {lead.company}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded border px-1.5 py-0.5 text-xs font-bold ${icp.color}`}
                                        >
                                            {icp.label}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                        {lead.location && <span>{lead.location}</span>}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {lead.tags.slice(0, 3).map((tag) => (
                                            <Badge
                                                key={tag}
                                                className="border-white/10 bg-white/5 text-[10px] text-[var(--text-secondary)]"
                                            >
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <LeadTable
                        leads={sortedLeads}
                        page={page}
                        pageSize={PAGE_SIZE}
                        total={total}
                        onPageChange={setPage}
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={handleSort}
                    />
                )}

                {/* Pagination info */}
                {!loading && leads.length > 0 && (
                    <div className="text-center text-xs text-[var(--text-secondary)]">
                        Showing page {page} of {totalPages} ({total} total leads)
                    </div>
                )}
            </div>
        </div>
    );
}
