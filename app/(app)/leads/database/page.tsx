// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useMemo, useState } from "react";
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
    { id: "l1", firstName: "Elliot", lastName: "Nestenborg", title: "Co-Founder & CEO", company: "Velaris", companyLogo: "S", location: "Stockholm, Sweden", email: "redacted@example.com", phone: "+46 70 000 0000", linkedinUrl: "#", avatarUrl: "", icpScore: 95, source: "database", tags: ["SaaS", "CEO"] },
    { id: "l2", firstName: "Oskar", lastName: "Moen", title: "Co-Founder & CTO", company: "Velaris", companyLogo: "S", location: "Stockholm, Sweden", email: "oskar@velaris.ai", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 88, source: "database", tags: ["SaaS", "CTO"] },
    { id: "l3", firstName: "Anna", lastName: "Lindqvist", title: "VP of Sales", company: "Klarna", companyLogo: "K", location: "Stockholm, Sweden", email: "anna.l@klarna.com", phone: "+46 73 555 1234", linkedinUrl: "#", avatarUrl: "", icpScore: 82, source: "extractor", tags: ["FinTech"] },
    { id: "l4", firstName: "Marcus", lastName: "Weber", title: "Head of Growth", company: "N26", companyLogo: "N", location: "Berlin, Germany", email: "m.weber@n26.com", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 76, source: "database", tags: ["FinTech", "Growth"] },
    { id: "l5", firstName: "Sophie", lastName: "Dupont", title: "Director of Marketing", company: "Contentsquare", companyLogo: "C", location: "Paris, France", email: null, phone: "+33 6 12 34 56 78", linkedinUrl: "#", avatarUrl: "", icpScore: 71, source: "database", tags: ["MarTech"] },
    { id: "l6", firstName: "James", lastName: "Henderson", title: "CEO", company: "ScaleUp Labs", companyLogo: "S", location: "London, United Kingdom", email: "james@scaleuplabs.io", phone: "+44 7700 123456", linkedinUrl: "#", avatarUrl: "", icpScore: 92, source: "csv", tags: ["Agency", "CEO"] },
    { id: "l7", firstName: "Priya", lastName: "Patel", title: "Senior Account Executive", company: "HubSpot", companyLogo: "H", location: "Dublin, Ireland", email: "ppatel@hubspot.com", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 55, source: "database", tags: ["SaaS", "Sales"] },
    { id: "l8", firstName: "Erik", lastName: "Johansson", title: "Founder", company: "GrowthHive", companyLogo: "G", location: "Gothenburg, Sweden", email: "erik@growthhive.se", phone: "+46 31 123 4567", linkedinUrl: "#", avatarUrl: "", icpScore: 89, source: "extractor", tags: ["Agency", "Founder"] },
    { id: "l9", firstName: "Lisa", lastName: "Kim", title: "VP Product", company: "Notion", companyLogo: "N", location: "San Francisco, United States", email: "l.kim@notion.so", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 64, source: "database", tags: ["SaaS", "Product"] },
    { id: "l10", firstName: "Thomas", lastName: "Müller", title: "Managing Director", company: "Kral Studio", companyLogo: "K", location: "Munich, Germany", email: "thomas@kralstudio.com", phone: "+49 89 1234567", linkedinUrl: "#", avatarUrl: "", icpScore: 78, source: "database", tags: ["Agency"] },
    { id: "l11", firstName: "Sarah", lastName: "Chen", title: "Chief Revenue Officer", company: "Drata", companyLogo: "D", location: "San Diego, United States", email: "sarah.c@drata.com", phone: "+1 619 555 0199", linkedinUrl: "#", avatarUrl: "", icpScore: 91, source: "database", tags: ["SaaS", "C-Suite"] },
    { id: "l12", firstName: "Mikael", lastName: "Björk", title: "Growth Lead", company: "Spotify", companyLogo: "S", location: "Stockholm, Sweden", email: null, phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 45, source: "extractor", tags: ["Tech", "Growth"] },
    { id: "l13", firstName: "Clara", lastName: "Rossi", title: "Head of Partnerships", company: "Revolut", companyLogo: "R", location: "London, United Kingdom", email: "clara.r@revolut.com", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 73, source: "database", tags: ["FinTech"] },
    { id: "l14", firstName: "David", lastName: "Park", title: "Co-Founder", company: "Lemon Squeezy", companyLogo: "L", location: "Austin, United States", email: "david@lemonsqueezy.com", phone: "+1 512 555 0177", linkedinUrl: "#", avatarUrl: "", icpScore: 86, source: "csv", tags: ["SaaS", "Founder"] },
    { id: "l15", firstName: "Nadia", lastName: "Al-Rashid", title: "Sales Director EMEA", company: "Salesforce", companyLogo: "S", location: "Amsterdam, Netherlands", email: "n.alrashid@salesforce.com", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 60, source: "database", tags: ["Enterprise", "Sales"] },
    { id: "l16", firstName: "Jonas", lastName: "Karles", title: "Co-Founder", company: "[redacted]", companyLogo: "D", location: "Stockholm, Sweden", email: "jonas@devotion.vc", phone: "+46 70 555 8899", linkedinUrl: "#", avatarUrl: "", icpScore: 97, source: "database", tags: ["VC", "Co-Founder"] },
    { id: "l17", firstName: "Emma", lastName: "Nilsson", title: "Marketing Manager", company: "Trustly", companyLogo: "T", location: "Stockholm, Sweden", email: "emma.n@trustly.com", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 68, source: "extractor", tags: ["FinTech", "Marketing"] },
    { id: "l18", firstName: "Ryan", lastName: "O'Connor", title: "VP Engineering", company: "Stripe", companyLogo: "S", location: "Dublin, Ireland", email: null, phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 42, source: "database", tags: ["FinTech", "Engineering"] },
    { id: "l19", firstName: "Fatima", lastName: "Hassan", title: "CEO & Founder", company: "BecGrowth", companyLogo: "B", location: "Dubai, UAE", email: "fatima@becgrowth.com", phone: "+971 50 123 4567", linkedinUrl: "#", avatarUrl: "", icpScore: 84, source: "database", tags: ["Agency", "CEO"] },
    { id: "l20", firstName: "Liam", lastName: "Brown", title: "Account Executive", company: "Gong", companyLogo: "G", location: "Sydney, Australia", email: "liam.b@gong.io", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 52, source: "database", tags: ["SaaS", "Sales"] },
    { id: "l21", firstName: "Isabella", lastName: "Martinez", title: "Head of Sales", company: "Meed", companyLogo: "M", location: "Madrid, Spain", email: "isabella@meed.com", phone: "+34 612 345 678", linkedinUrl: "#", avatarUrl: "", icpScore: 79, source: "csv", tags: ["SaaS"] },
    { id: "l22", firstName: "Oliver", lastName: "Schmidt", title: "CTO", company: "Verma Tech", companyLogo: "V", location: "Vienna, Austria", email: "oliver@vermatech.io", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 87, source: "database", tags: ["SaaS", "CTO"] },
    { id: "l23", firstName: "Chloe", lastName: "Laurent", title: "Growth Manager", company: "Algolia", companyLogo: "A", location: "Paris, France", email: "chloe.l@algolia.com", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 66, source: "extractor", tags: ["SaaS", "Growth"] },
    { id: "l24", firstName: "Henrik", lastName: "Svensson", title: "Founder & CEO", company: "SeaOfLeads", companyLogo: "S", location: "Malmö, Sweden", email: "henrik@seaofleads.com", phone: "+46 40 123 456", linkedinUrl: "#", avatarUrl: "", icpScore: 93, source: "database", tags: ["LeadGen", "CEO"] },
    { id: "l25", firstName: "Aiko", lastName: "Tanaka", title: "Director of Business Dev", company: "Mercari", companyLogo: "M", location: "Tokyo, Japan", email: "aiko.t@mercari.com", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 58, source: "database", tags: ["E-Commerce"] },
];

const PAGE_SIZE = 25;
const TOTAL_LEADS = 500;
const VIEW_TABLE = "table" as const;
const VIEW_GRID = "grid" as const;

/**
 * Lead Database page — 300M+ verified contacts with advanced filters.
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

    /* ─── Filter + sort logic ───────────────────────── */

    const filtered = useMemo(() => {
        let result = [...MOCK_LEADS];

        // Text search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (l) =>
                    l.firstName.toLowerCase().includes(q) ||
                    l.lastName.toLowerCase().includes(q) ||
                    l.title.toLowerCase().includes(q) ||
                    l.company.toLowerCase().includes(q) ||
                    l.location.toLowerCase().includes(q)
            );
        }

        // Location filter
        if (filters.locations.length > 0) {
            result = result.filter((l) =>
                filters.locations.some((loc) =>
                    l.location.toLowerCase().includes(loc.toLowerCase())
                )
            );
        }

        // Sort
        result.sort((a, b) => {
            let cmp = 0;
            switch (sortKey) {
                case "name":
                    cmp = `${a.firstName} ${a.lastName}`.localeCompare(
                        `${b.firstName} ${b.lastName}`
                    );
                    break;
                case "title":
                    cmp = a.title.localeCompare(b.title);
                    break;
                case "company":
                    cmp = a.company.localeCompare(b.company);
                    break;
                case "location":
                    cmp = a.location.localeCompare(b.location);
                    break;
                case "icpScore":
                    cmp = (a.icpScore ?? 0) - (b.icpScore ?? 0);
                    break;
            }
            return sortDir === "asc" ? cmp : -cmp;
        });

        return result;
    }, [searchQuery, filters, sortKey, sortDir]);

    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    function handleSort(key: SortKey) {
        if (key === sortKey) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("desc");
        }
        setPage(1);
    }

    return (
        <div className="flex h-full flex-1">
            {/* Filter panel */}
            <LeadFilterPanel filters={filters} onChange={setFilters} />

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
                                300M+ Verified Contacts
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
                        className="h-9 gap-1.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400"
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
                {paged.length === 0 ? (
                    <div className="flex-1 overflow-y-auto p-6">
                        <EmptyState icon={Users} title="No leads found" description="No leads found matching your filters. Try adjusting your search criteria." />
                    </div>
                ) : view === VIEW_GRID ? (
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {paged.map((lead) => (
                                <div
                                    key={lead.id}
                                    className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-4 hover:border-white/10 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-purple-700/20 text-sm font-medium text-purple-300">
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
                        leads={paged}
                        page={page}
                        pageSize={PAGE_SIZE}
                        total={filtered.length > MOCK_LEADS.length ? filtered.length : TOTAL_LEADS}
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
