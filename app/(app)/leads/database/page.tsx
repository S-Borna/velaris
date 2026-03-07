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
    { id: "l1", firstName: "Tim", lastName: "Cook", title: "CEO", company: "Apple", companyLogo: "A", location: "Cupertino, United States", email: "tcook@apple.com", phone: "+1 408 555 1234", linkedinUrl: "#", avatarUrl: "", icpScore: 98, source: "database", tags: ["Big Tech", "CEO"] },
    { id: "l2", firstName: "Satya", lastName: "Nadella", title: "CEO", company: "Microsoft", companyLogo: "M", location: "Redmond, United States", email: "satya@microsoft.com", phone: "+1 425 555 5678", linkedinUrl: "#", avatarUrl: "", icpScore: 97, source: "database", tags: ["Big Tech", "CEO"] },
    { id: "l3", firstName: "Sundar", lastName: "Pichai", title: "CEO", company: "Alphabet", companyLogo: "G", location: "Mountain View, United States", email: "sundar@google.com", phone: "+1 650 555 9012", linkedinUrl: "#", avatarUrl: "", icpScore: 96, source: "extractor", tags: ["Big Tech", "CEO"] },
    { id: "l4", firstName: "Dario", lastName: "Amodei", title: "CEO", company: "Anthropic", companyLogo: "A", location: "San Francisco, United States", email: "dario@anthropic.com", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 95, source: "database", tags: ["AI", "CEO"] },
    { id: "l5", firstName: "Mark", lastName: "Zuckerberg", title: "CEO", company: "Meta", companyLogo: "M", location: "Menlo Park, United States", email: null, phone: "+1 650 555 3456", linkedinUrl: "#", avatarUrl: "", icpScore: 94, source: "database", tags: ["Big Tech", "CEO"] },
    { id: "l6", firstName: "Elon", lastName: "Musk", title: "CEO & Technoking", company: "Tesla / SpaceX", companyLogo: "T", location: "Austin, United States", email: "elon@tesla.com", phone: "+1 512 555 7890", linkedinUrl: "#", avatarUrl: "", icpScore: 93, source: "csv", tags: ["Deep Tech", "CEO"] },
    { id: "l7", firstName: "Sam", lastName: "Altman", title: "CEO", company: "OpenAI", companyLogo: "O", location: "San Francisco, United States", email: "sam@openai.com", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 92, source: "database", tags: ["AI", "CEO"] },
    { id: "l8", firstName: "Jensen", lastName: "Huang", title: "CEO & Founder", company: "NVIDIA", companyLogo: "N", location: "Santa Clara, United States", email: "jhuang@nvidia.com", phone: "+1 408 555 2345", linkedinUrl: "#", avatarUrl: "", icpScore: 91, source: "extractor", tags: ["Semiconductors", "CEO"] },
    { id: "l9", firstName: "Lisa", lastName: "Su", title: "CEO", company: "AMD", companyLogo: "A", location: "Santa Clara, United States", email: "lisa.su@amd.com", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 90, source: "database", tags: ["Semiconductors", "CEO"] },
    { id: "l10", firstName: "Andy", lastName: "Jassy", title: "CEO", company: "Amazon", companyLogo: "A", location: "Seattle, United States", email: "ajassy@amazon.com", phone: "+1 206 555 6789", linkedinUrl: "#", avatarUrl: "", icpScore: 89, source: "database", tags: ["Big Tech", "CEO"] },
    { id: "l11", firstName: "Sheryl", lastName: "Sandberg", title: "Board Director", company: "Meta", companyLogo: "M", location: "Menlo Park, United States", email: "sheryl@meta.com", phone: "+1 650 555 0199", linkedinUrl: "#", avatarUrl: "", icpScore: 88, source: "database", tags: ["Big Tech", "C-Suite"] },
    { id: "l12", firstName: "Brian", lastName: "Chesky", title: "CEO & Co-Founder", company: "Airbnb", companyLogo: "A", location: "San Francisco, United States", email: null, phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 87, source: "extractor", tags: ["Travel Tech", "CEO"] },
    { id: "l13", firstName: "Marc", lastName: "Benioff", title: "CEO & Co-Founder", company: "Salesforce", companyLogo: "S", location: "San Francisco, United States", email: "marc@salesforce.com", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 86, source: "database", tags: ["Enterprise SaaS", "CEO"] },
    { id: "l14", firstName: "Daniel", lastName: "Ek", title: "CEO & Co-Founder", company: "Spotify", companyLogo: "S", location: "Stockholm, Sweden", email: "daniel@spotify.com", phone: "+46 70 555 0177", linkedinUrl: "#", avatarUrl: "", icpScore: 85, source: "csv", tags: ["Music Tech", "CEO"] },
    { id: "l15", firstName: "Jack", lastName: "Dorsey", title: "CEO", company: "Block", companyLogo: "B", location: "San Francisco, United States", email: "jack@block.xyz", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 84, source: "database", tags: ["FinTech", "CEO"] },
    { id: "l16", firstName: "Patrick", lastName: "Collison", title: "CEO & Co-Founder", company: "Stripe", companyLogo: "S", location: "San Francisco, United States", email: "patrick@stripe.com", phone: "+1 415 555 8899", linkedinUrl: "#", avatarUrl: "", icpScore: 83, source: "database", tags: ["FinTech", "CEO"] },
    { id: "l17", firstName: "Tobi", lastName: "Lütke", title: "CEO & Founder", company: "Shopify", companyLogo: "S", location: "Ottawa, Canada", email: "tobi@shopify.com", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 82, source: "extractor", tags: ["E-Commerce", "CEO"] },
    { id: "l18", firstName: "Reed", lastName: "Hastings", title: "Co-Founder & Executive Chairman", company: "Netflix", companyLogo: "N", location: "Los Gatos, United States", email: null, phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 81, source: "database", tags: ["Streaming", "Founder"] },
    { id: "l19", firstName: "Stewart", lastName: "Butterfield", title: "Co-Founder", company: "Slack", companyLogo: "S", location: "San Francisco, United States", email: "stewart@slack.com", phone: "+1 415 555 4567", linkedinUrl: "#", avatarUrl: "", icpScore: 80, source: "database", tags: ["SaaS", "Founder"] },
    { id: "l20", firstName: "Drew", lastName: "Houston", title: "CEO & Co-Founder", company: "Dropbox", companyLogo: "D", location: "San Francisco, United States", email: "drew@dropbox.com", phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 79, source: "database", tags: ["SaaS", "CEO"] },
    { id: "l21", firstName: "Marissa", lastName: "Mayer", title: "CEO & Co-Founder", company: "Sunshine", companyLogo: "S", location: "Palo Alto, United States", email: "marissa@sunshine.com", phone: "+1 650 555 6780", linkedinUrl: "#", avatarUrl: "", icpScore: 78, source: "csv", tags: ["Tech", "CEO"] },
    { id: "l22", firstName: "Jeff", lastName: "Bezos", title: "Executive Chairman", company: "Amazon", companyLogo: "A", location: "Miami, United States", email: null, phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 77, source: "database", tags: ["Big Tech", "Founder"] },
    { id: "l23", firstName: "Susan", lastName: "Wojcicki", title: "Former CEO", company: "YouTube", companyLogo: "Y", location: "San Bruno, United States", email: null, phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 76, source: "extractor", tags: ["Big Tech", "Executive"] },
    { id: "l24", firstName: "Travis", lastName: "Kalanick", title: "Founder", company: "CloudKitchens", companyLogo: "C", location: "Los Angeles, United States", email: "travis@ck.com", phone: "+1 213 555 456", linkedinUrl: "#", avatarUrl: "", icpScore: 75, source: "database", tags: ["Logistics", "Founder"] },
    { id: "l25", firstName: "Ginni", lastName: "Rometty", title: "Former CEO", company: "IBM", companyLogo: "I", location: "New York, United States", email: null, phone: null, linkedinUrl: "#", avatarUrl: "", icpScore: 74, source: "database", tags: ["Enterprise", "Executive"] },
];

const PAGE_SIZE = 25;
const TOTAL_LEADS = 500;
const VIEW_TABLE = "table" as const;
const VIEW_GRID = "grid" as const;

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
