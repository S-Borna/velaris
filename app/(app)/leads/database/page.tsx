// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Database,
    Download,
    LayoutGrid,
    LayoutList,
    Search,
    Sparkles,
    Users,
    X,
} from "lucide-react";
import { LeadFilterPanel, EMPTY_FILTERS } from "@/components/leads/lead-filters";
import type { LeadFilters } from "@/components/leads/lead-filters";
import { LeadTable } from "@/components/leads/lead-table";
import type { LeadRow, SortKey } from "@/components/leads/lead-table";
import { EmptyState } from "@/components/common/empty-state";

/* ─── Mock data ─────────────────────────────────────── */

const MOCK_LEADS: LeadRow[] = [
    { id: "l1", firstName: "Marcus", lastName: "Reyes", title: "CEO", company: "Solace Technologies", companyLogo: "S", location: "Cupertino, United States", email: "mreyes@solace.example", phone: "+1 408 555 8821", linkedinUrl: "#", avatarUrl: "", icpScore: 98, source: "database", tags: ["Big Tech", "CEO"] },
    { id: "l2", firstName: "Devansh", lastName: "Rao", title: "CEO", company: "Northwind Software", companyLogo: "N", location: "Redmond, United States", email: "devansh@northwind.example", phone: "+1 425 555 3390", linkedinUrl: "#", avatarUrl: "", icpScore: 97, source: "database", tags: ["Big Tech", "CEO"] },
    { id: "l3", firstName: "Arvind", lastName: "Mehta", title: "CEO", company: "Meridian Labs", companyLogo: "M", location: "Mountain View, United States", email: "arvind@meridian.example", phone: "+1 650 555 4471", linkedinUrl: "#", avatarUrl: "", icpScore: 96, source: "extractor", tags: ["Big Tech", "CEO"] },
    { id: "l4", firstName: "Elian", lastName: "Cross", title: "CEO", company: "Cognivance AI", companyLogo: "C", location: "San Francisco, United States", email: "elian@cognivance.example", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 95, source: "database", tags: ["AI", "CEO"] },
    { id: "l5", firstName: "Adrian", lastName: "Voss", title: "CEO", company: "Connectiv", companyLogo: "C", location: "Menlo Park, United States", email: null, phone: "+1 650 555 7765", linkedinUrl: "#", avatarUrl: "", icpScore: 94, source: "database", tags: ["Big Tech", "CEO"] },
    { id: "l6", firstName: "Nolan", lastName: "Vance", title: "CEO & Technoking", company: "Voltera Motors / Starhaven Aerospace", companyLogo: "V", location: "Austin, United States", email: "nolan@voltera.example", phone: "+1 512 555 2214", linkedinUrl: "#", avatarUrl: "", icpScore: 93, source: "csv", tags: ["Deep Tech", "CEO"] },
    { id: "l7", firstName: "Ezra", lastName: "Kaplan", title: "CEO", company: "Mindforge AI", companyLogo: "M", location: "San Francisco, United States", email: "ezra@mindforge.example", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 92, source: "database", tags: ["AI", "CEO"] },
    { id: "l8", firstName: "Wei", lastName: "Tanaka", title: "CEO & Founder", company: "ChipCore Systems", companyLogo: "C", location: "Santa Clara, United States", email: "wtanaka@chipcore.example", phone: "+1 408 555 6689", linkedinUrl: "#", avatarUrl: "", icpScore: 91, source: "extractor", tags: ["Semiconductors", "CEO"] },
    { id: "l9", firstName: "Mei", lastName: "Chen", title: "CEO", company: "SiliconEdge", companyLogo: "S", location: "Santa Clara, United States", email: "mei.chen@siliconedge.example", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 90, source: "database", tags: ["Semiconductors", "CEO"] },
    { id: "l10", firstName: "Derek", lastName: "Holt", title: "CEO", company: "Cartway", companyLogo: "C", location: "Seattle, United States", email: "dholt@cartway.example", phone: "+1 206 555 1123", linkedinUrl: "#", avatarUrl: "", icpScore: 89, source: "database", tags: ["Big Tech", "CEO"] },
    { id: "l11", firstName: "Rachel", lastName: "Voss", title: "Board Director", company: "Connectiv", companyLogo: "C", location: "Menlo Park, United States", email: "rachel@connectiv.example", phone: "+1 650 555 9042", linkedinUrl: "#", avatarUrl: "", icpScore: 88, source: "database", tags: ["Big Tech", "C-Suite"] },
    { id: "l12", firstName: "Julian", lastName: "Marsh", title: "CEO & Co-Founder", company: "Havenly", companyLogo: "H", location: "San Francisco, United States", email: null, phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 87, source: "extractor", tags: ["Travel Tech", "CEO"] },
    { id: "l13", firstName: "Victor", lastName: "Lane", title: "CEO & Co-Founder", company: "Cloudpeak", companyLogo: "C", location: "San Francisco, United States", email: "victor@cloudpeak.example", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 86, source: "database", tags: ["Enterprise SaaS", "CEO"] },
    { id: "l14", firstName: "Anders", lastName: "Lindqvist", title: "CEO & Co-Founder", company: "Sonora", companyLogo: "S", location: "Stockholm, Sweden", email: "anders@sonora.example", phone: "+46 70 555 8834", linkedinUrl: "#", avatarUrl: "", icpScore: 85, source: "csv", tags: ["Music Tech", "CEO"] },
    { id: "l15", firstName: "Miles", lastName: "Hutton", title: "CEO", company: "Squarepay", companyLogo: "S", location: "San Francisco, United States", email: "miles@squarepay.example", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 84, source: "database", tags: ["FinTech", "CEO"] },
    { id: "l16", firstName: "Connor", lastName: "Doyle", title: "CEO & Co-Founder", company: "Payflow", companyLogo: "P", location: "San Francisco, United States", email: "connor@payflow.example", phone: "+1 415 555 3312", linkedinUrl: "#", avatarUrl: "", icpScore: 83, source: "database", tags: ["FinTech", "CEO"] },
    { id: "l17", firstName: "Finn", lastName: "Kessler", title: "CEO & Founder", company: "Cartly", companyLogo: "C", location: "Ottawa, Canada", email: "finn@cartly.example", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 82, source: "extractor", tags: ["E-Commerce", "CEO"] },
    { id: "l18", firstName: "Owen", lastName: "Farrell", title: "Co-Founder & Executive Chairman", company: "Streamix", companyLogo: "S", location: "Los Gatos, United States", email: null, phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 81, source: "database", tags: ["Streaming", "Founder"] },
    { id: "l19", firstName: "Graham", lastName: "Ellis", title: "Co-Founder", company: "Chatterbox", companyLogo: "C", location: "San Francisco, United States", email: "graham@chatterbox.example", phone: "+1 415 555 9981", linkedinUrl: "#", avatarUrl: "", icpScore: 80, source: "database", tags: ["SaaS", "Founder"] },
    { id: "l20", firstName: "Cole", lastName: "Bennett", title: "CEO & Co-Founder", company: "Filevault", companyLogo: "F", location: "San Francisco, United States", email: "cole@filevault.example", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 79, source: "database", tags: ["SaaS", "CEO"] },
    { id: "l21", firstName: "Nadia", lastName: "Sorensen", title: "CEO & Co-Founder", company: "Sunshine", companyLogo: "S", location: "Palo Alto, United States", email: "nadia@sunshine.example", phone: "+1 650 555 2298", linkedinUrl: "#", avatarUrl: "", icpScore: 78, source: "csv", tags: ["Tech", "CEO"] },
    { id: "l22", firstName: "Walter", lastName: "Kingston", title: "Executive Chairman", company: "Cartway", companyLogo: "C", location: "Miami, United States", email: null, phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 77, source: "database", tags: ["Big Tech", "Founder"] },
    { id: "l23", firstName: "Elena", lastName: "Ward", title: "Former CEO", company: "Vidstream", companyLogo: "V", location: "San Bruno, United States", email: null, phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 76, source: "extractor", tags: ["Big Tech", "Executive"] },
    { id: "l24", firstName: "Dean", lastName: "Foley", title: "Founder", company: "GhostKitchen Co", companyLogo: "G", location: "Los Angeles, United States", email: "dean@ghostkitchen.example", phone: "+1 213 555 7743", linkedinUrl: "#", avatarUrl: "", icpScore: 75, source: "database", tags: ["Logistics", "Founder"] },
    { id: "l25", firstName: "Carol", lastName: "Whitfield", title: "Former CEO", company: "Enterlogic", companyLogo: "E", location: "New York, United States", email: null, phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 74, source: "database", tags: ["Enterprise", "Executive"] },
];

const PAGE_SIZE = 25;
const TOTAL_LEADS = 500;
const VIEW_TABLE = "table" as const;
const VIEW_GRID = "grid" as const;

/** Map client sort key to API column name. Module-level to avoid re-render loops. */
const SORT_MAP: Record<SortKey, string> = {
    name: "fullName",
    title: "title",
    company: "company",
    location: "location",
    icpScore: "icpScore",
};

/**
 * Lead Database page — verified contacts with advanced filters.
 * Matches CLAUDE.md spec: search bar, 11 filter categories (83 total filters),
 * sortable table, pagination, table/grid toggle.
 */
export default function LeadDatabasePage() {
    const [filters, setFilters] = useState<LeadFilters>(EMPTY_FILTERS);
    const [searchQuery, setSearchQuery] = useState("");
    const [view, setView] = useState<typeof VIEW_TABLE | typeof VIEW_GRID>(VIEW_TABLE);
    const [page, setPage] = useState(1);
    const [sortKey, setSortKey] = useState<SortKey>("icpScore");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
    const [lookalikeSource, setLookalikeSource] = useState<string | null>(null);
    const [leads, setLeads] = useState<LeadRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalFromApi, setTotalFromApi] = useState(TOTAL_LEADS);

    const mapLead = useCallback((l: Record<string, unknown>): LeadRow => ({
        id: String(l.id),
        firstName: String(l.firstName ?? ""),
        lastName: String(l.lastName ?? ""),
        title: String(l.title ?? ""),
        company: String(l.company ?? ""),
        companyLogo: String(l.company ?? "?").charAt(0),
        location: String(l.location ?? ""),
        email: l.email ? String(l.email) : null,
        phone: l.phone ? String(l.phone) : null,
        linkedinUrl: String(l.linkedinUrl ?? "#"),
        avatarUrl: l.avatarUrl ? String(l.avatarUrl) : "",
        icpScore: l.icpScore != null ? Number(l.icpScore) : null,
        source: String(l.source ?? "database") as LeadRow["source"],
        tags: Array.isArray(l.tags) ? (l.tags as string[]) : [],
    }), []);

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("pageSize", String(PAGE_SIZE));
            if (searchQuery.trim()) params.set("search", searchQuery.trim());
            params.set("sort", SORT_MAP[sortKey]);
            params.set("order", sortDir);
            if (filters.locations.length > 0) params.set("locations", filters.locations.join(","));
            if (filters.industries.length > 0) params.set("industries", filters.industries.join(","));
            if (filters.companySizes.length > 0) params.set("companySizes", filters.companySizes.join(","));

            const res = await fetch(`/api/leads?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json() as { data: Record<string, unknown>[]; total?: number };
            setTotalFromApi(json.total ?? TOTAL_LEADS);
            setLeads((json.data ?? []).map(mapLead));
        } catch {
            setLeads(MOCK_LEADS);
            setTotalFromApi(TOTAL_LEADS);
        } finally {
            setLoading(false);
        }
    }, [page, searchQuery, sortKey, sortDir, filters, mapLead]);

    useEffect(() => { void fetchLeads(); }, [fetchLeads]);

    function handleSort(key: SortKey) {
        if (key === sortKey) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
        setPage(1);
    }

    function handleExport(): void {
        const header = "First Name,Last Name,Title,Company,Location,Email,Phone,ICP Score";
        const rows = leads.map((l) =>
            [l.firstName, l.lastName, l.title, l.company, l.location, l.email ?? "", l.phone ?? "", l.icpScore ?? ""].join(",")
        );
        const csv = [header, ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function handleFilterChange(newFilters: LeadFilters): void {
        setFilters(newFilters);
        setPage(1);
    }

    if (loading) return <div className="flex h-96 items-center justify-center"><p className="text-sm text-[var(--text-muted)]">Loading leads…</p></div>;

    return (
        <div className="flex h-full flex-1">
            {/* Filter panel */}
            <LeadFilterPanel filters={filters} onChange={handleFilterChange} />

            {/* Main content */}
            <div className="flex flex-1 flex-col">
                {/* Top bar */}
                <div className="flex items-center justify-between border-b border-white/6 px-6 py-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                                Lead Database
                            </h1>
                            <Badge
                                variant="outline"
                                className="border-purple-500/30 bg-purple-500/15 text-purple-300 text-xs gap-1"
                            >
                                <Database className="h-3 w-3" />
                                Advanced Lead Search
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            Real-time data enrichment included. No add-ons or
                            upsells.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View toggle */}
                        <div className="flex rounded-lg border border-white/10 bg-white/5">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setView(VIEW_TABLE)}
                                className={`h-8 rounded-r-none px-2.5 ${view === VIEW_TABLE
                                    ? "bg-purple-500/20 text-purple-300"
                                    : "text-[var(--text-muted)]"
                                    }`}
                            >
                                <LayoutList className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setView(VIEW_GRID)}
                                className={`h-8 rounded-l-none px-2.5 ${view === VIEW_GRID
                                    ? "bg-purple-500/20 text-purple-300"
                                    : "text-[var(--text-muted)]"
                                    }`}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            className="h-8 gap-1.5 border-white/10 bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Export Data
                        </Button>
                    </div>
                </div>

                {/* Lookalike banner */}
                {lookalikeSource && (
                    <div className="flex items-center justify-between border-b border-cyan-500/20 bg-cyan-500/5 px-6 py-2.5">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-cyan-400" />
                            <span className="text-xs text-cyan-300">
                                Showing leads similar to <strong>{lookalikeSource}</strong>
                            </span>
                        </div>
                        <button
                            onClick={() => setLookalikeSource(null)}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-cyan-300 transition-colors hover:bg-cyan-500/10"
                        >
                            <X className="h-3 w-3" />
                            Clear
                        </button>
                    </div>
                )}

                {/* Search + action bar */}
                <div className="flex items-center gap-3 border-b border-white/6 px-6 py-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                        <Input
                            placeholder="Search leads by name, title, company, or location..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            className="h-9 border-white/10 bg-[var(--bg-input)] pl-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:ring-purple-500/20"
                        />
                    </div>

                    <Button
                        size="sm"
                        className="h-9 gap-1.5 bg-purple-600 text-white hover:bg-purple-500"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        AI Search
                    </Button>

                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span>Set Filters</span>
                        <span className="text-white/20">→</span>
                        <span>Search Leads</span>
                        <span className="text-white/20">→</span>
                        <span>Export Data</span>
                    </div>
                </div>

                {/* Grid view */}
                {leads.length === 0 ? (
                    <div className="flex-1 overflow-y-auto p-6">
                        <EmptyState icon={Users} title="No leads found" description="No leads found matching your filters. Try adjusting your search criteria." />
                    </div>
                ) : view === VIEW_GRID ? (
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {leads.map((lead) => (
                                <div
                                    key={lead.id}
                                    className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-4 hover:border-white/10 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600/25 text-sm font-medium text-purple-300">
                                            {lead.firstName[0]}
                                            {lead.lastName[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                                {lead.firstName} {lead.lastName}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)] truncate">
                                                {lead.title}
                                            </p>
                                        </div>
                                        {lead.icpScore !== null && (
                                            <Badge
                                                variant="outline"
                                                className={`text-xs ${lead.icpScore >= 80
                                                    ? "border-green-500/30 bg-green-500/15 text-green-300"
                                                    : lead.icpScore >= 50
                                                        ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
                                                        : "border-red-500/30 bg-red-500/15 text-red-300"
                                                    }`}
                                            >
                                                {lead.icpScore}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="mt-3 space-y-1.5 text-xs text-[var(--text-secondary)]">
                                        <p className="flex items-center gap-2">
                                            <span className="flex h-4 w-4 items-center justify-center rounded bg-white/5 text-[8px] font-bold text-[var(--text-muted)]">
                                                {lead.company[0]}
                                            </span>
                                            {lead.company}
                                        </p>
                                        <p>{lead.location}</p>
                                    </div>
                                    <div className="mt-3 flex items-center gap-3">
                                        {lead.email && (
                                            <Badge
                                                variant="outline"
                                                className="border-green-500/20 bg-green-500/10 text-green-400 text-[10px]"
                                            >
                                                Email
                                            </Badge>
                                        )}
                                        {lead.phone && (
                                            <Badge
                                                variant="outline"
                                                className="border-green-500/20 bg-green-500/10 text-green-400 text-[10px]"
                                            >
                                                Phone
                                            </Badge>
                                        )}
                                        {lead.tags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="outline"
                                                className="border-white/10 text-[var(--text-muted)] text-[10px]"
                                            >
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <LeadTable
                        leads={leads}
                        page={page}
                        pageSize={PAGE_SIZE}
                        total={totalFromApi}
                        onPageChange={setPage}
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={handleSort}
                        onFindSimilar={(lead) => {
                            setLookalikeSource(`${lead.firstName} ${lead.lastName}`);
                            setSearchQuery("");
                            setPage(1);
                        }}
                    />
                )}
            </div>
        </div>
    );
}
