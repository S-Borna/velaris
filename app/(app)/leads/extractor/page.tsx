// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import {
    CheckCircle2,
    Download,
    ExternalLink,
    Loader2,
    Mail,
    Phone,
    Plus,
    Search,
    Users,
    X,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────

type ExtractionSource = "search" | "post" | "sales_navigator";

interface ExtractedLead {
    id: string;
    firstName: string;
    lastName: string;
    title: string;
    company: string;
    location: string;
    linkedinUrl: string;
    email: string | null;
    phone: string | null;
    icpScore: number | null;
}

// ─── Constants ──────────────────────────────────────────

const SOURCE_CONFIG: Record<ExtractionSource, { label: string; description: string }> = {
    search: { label: "LinkedIn Search", description: "Extract from a LinkedIn search URL" },
    post: { label: "LinkedIn Post", description: "Extract from a LinkedIn post's engagers" },
    sales_navigator: {
        label: "Sales Navigator",
        description: "Extract from Sales Navigator search",
    },
};

// ─── Main Component ─────────────────────────────────────

export default function LeadExtractorPage() {
    const [showWizard, setShowWizard] = useState(false);
    const [selectedSource, setSelectedSource] = useState<ExtractionSource | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [maxLeads, setMaxLeads] = useState(100);
    const [extracting, setExtracting] = useState(false);

    // Results
    const [results, setResults] = useState<ExtractedLead[]>([]);
    const [resultTotal, setResultTotal] = useState(0);
    const [hasSearched, setHasSearched] = useState(false);

    // Previously extracted leads (from DB with source=extractor)
    const [recentLeads, setRecentLeads] = useState<ExtractedLead[]>([]);
    const [recentTotal, setRecentTotal] = useState(0);
    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

    // Load recent extracted leads from the database
    const fetchRecentExtractions = useCallback(async () => {
        try {
            const res = await fetch("/api/leads?source=extractor&pageSize=20");
            if (!res.ok) return;
            const json = await res.json();
            const items = json.data?.data ?? [];
            setRecentLeads(
                items.map(
                    (l: {
                        id: string;
                        firstName: string | null;
                        lastName: string | null;
                        title: string | null;
                        company: string | null;
                        location: string | null;
                        linkedinUrl: string | null;
                        email: string | null;
                        phone: string | null;
                        icpScore: number | null;
                    }) => ({
                        id: l.id,
                        firstName: l.firstName ?? "",
                        lastName: l.lastName ?? "",
                        title: l.title ?? "",
                        company: l.company ?? "",
                        location: l.location ?? "",
                        linkedinUrl: l.linkedinUrl ?? "",
                        email: l.email,
                        phone: l.phone,
                        icpScore: l.icpScore,
                    }),
                ),
            );
            setRecentTotal(json.data?.total ?? 0);
        } catch {
            // Silent
        }
    }, []);

    useEffect(() => {
        fetchRecentExtractions();
    }, [fetchRecentExtractions]);

    async function handleExtract(): Promise<void> {
        if (!searchQuery.trim()) return;
        setExtracting(true);
        setHasSearched(true);
        try {
            const res = await fetch("/api/leads/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: searchQuery.trim(),
                    size: maxLeads,
                }),
            });

            if (!res.ok) throw new Error("Search failed");
            const json = await res.json();
            const leads = json.leads ?? [];

            setResults(
                leads.map(
                    (
                        l: {
                            id?: string;
                            firstName?: string;
                            lastName?: string;
                            title?: string;
                            company?: string;
                            location?: string;
                            linkedinUrl?: string;
                            email?: string;
                            phone?: string;
                        },
                        idx: number,
                    ) => ({
                        id: l.id ?? `search-${idx}`,
                        firstName: l.firstName ?? "",
                        lastName: l.lastName ?? "",
                        title: l.title ?? "",
                        company: l.company ?? "",
                        location: l.location ?? "",
                        linkedinUrl: l.linkedinUrl ?? "",
                        email: l.email ?? null,
                        phone: l.phone ?? null,
                        icpScore: null,
                    }),
                ),
            );
            setResultTotal(json.total ?? leads.length);
        } catch {
            setResults([]);
            setResultTotal(0);
        } finally {
            setExtracting(false);
        }
    }

    async function handleSaveLead(lead: ExtractedLead): Promise<void> {
        setSavingIds((prev) => new Set(prev).add(lead.id));
        try {
            await fetch("/api/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: lead.firstName,
                    lastName: lead.lastName,
                    fullName: `${lead.firstName} ${lead.lastName}`.trim(),
                    title: lead.title,
                    company: lead.company,
                    location: lead.location,
                    linkedinUrl: lead.linkedinUrl,
                    email: lead.email,
                    phone: lead.phone,
                    source: "extractor",
                }),
            });
            fetchRecentExtractions();
        } catch {
            // Silent
        } finally {
            setSavingIds((prev) => {
                const next = new Set(prev);
                next.delete(lead.id);
                return next;
            });
        }
    }

    async function handleSaveAll(): Promise<void> {
        if (results.length === 0) return;
        try {
            await fetch("/api/leads/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    leads: results.map((l) => ({
                        firstName: l.firstName,
                        lastName: l.lastName,
                        fullName: `${l.firstName} ${l.lastName}`.trim(),
                        title: l.title,
                        company: l.company,
                        location: l.location,
                        linkedinUrl: l.linkedinUrl,
                        email: l.email,
                        phone: l.phone,
                        source: "extractor" as const,
                    })),
                }),
            });
            fetchRecentExtractions();
        } catch {
            // Silent
        }
    }

    const emailCount = results.filter((l) => l.email).length;
    const phoneCount = results.filter((l) => l.phone).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        Lead Extractor
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Extract leads from LinkedIn searches and posts
                    </p>
                </div>
                <Button
                    onClick={() => setShowWizard(!showWizard)}
                    className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400"
                >
                    {showWizard ? (
                        <X className="mr-2 h-4 w-4" />
                    ) : (
                        <Plus className="mr-2 h-4 w-4" />
                    )}
                    {showWizard ? "Close" : "Extract Leads"}
                </Button>
            </div>

            {/* Extraction Wizard */}
            {showWizard && (
                <div className="rounded-xl border border-purple-500/20 bg-[var(--bg-card)] p-6">
                    <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
                        New Extraction
                    </h3>

                    {/* Source Selection */}
                    <div className="mb-4 grid gap-3 md:grid-cols-3">
                        {(Object.entries(SOURCE_CONFIG) as Array<[ExtractionSource, typeof SOURCE_CONFIG.search]>).map(
                            ([key, cfg]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setSelectedSource(key)}
                                    className={`rounded-lg border p-4 text-left transition ${
                                        selectedSource === key
                                            ? "border-purple-500/50 bg-purple-500/5"
                                            : "border-white/10 hover:border-white/20"
                                    }`}
                                >
                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                        {cfg.label}
                                    </p>
                                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                                        {cfg.description}
                                    </p>
                                </button>
                            ),
                        )}
                    </div>

                    {/* Search Input */}
                    <div className="mb-4 grid gap-4 md:grid-cols-3">
                        <div className="md:col-span-2">
                            <label
                                htmlFor="extract-query"
                                className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                            >
                                Search Query or URL
                            </label>
                            <input
                                id="extract-query"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="e.g., Marketing agencies in Sweden"
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-purple-500/50 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="max-leads"
                                className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                            >
                                Max Leads
                            </label>
                            <input
                                id="max-leads"
                                type="number"
                                min={1}
                                max={1000}
                                value={maxLeads}
                                onChange={(e) =>
                                    setMaxLeads(parseInt(e.target.value, 10) || 100)
                                }
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] focus:border-purple-500/50 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowWizard(false)}
                            className="border-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleExtract}
                            disabled={extracting || !searchQuery.trim()}
                            className="bg-gradient-to-r from-purple-600 to-purple-500 text-white"
                        >
                            {extracting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    Start Extraction
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Results */}
            {hasSearched && (
                <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-4">
                            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                                Leads Found
                            </p>
                            <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
                                {resultTotal}
                            </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-4">
                            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                                Displayed
                            </p>
                            <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
                                {results.length}
                            </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-4">
                            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                                With Email
                            </p>
                            <p className="mt-1 text-xl font-semibold text-green-400">
                                {emailCount}
                            </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-4">
                            <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                                With Phone
                            </p>
                            <p className="mt-1 text-xl font-semibold text-blue-400">
                                {phoneCount}
                            </p>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">
                            Results
                        </h3>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-white/10 text-xs"
                            >
                                <Download className="mr-1 h-3.5 w-3.5" /> Export
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveAll}
                                disabled={results.length === 0}
                                className="bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-xs"
                            >
                                <Plus className="mr-1 h-3.5 w-3.5" /> Save All to Database
                            </Button>
                        </div>
                    </div>

                    {/* Results Table */}
                    {results.length === 0 ? (
                        <div className="flex h-32 items-center justify-center rounded-xl border border-white/10 bg-[var(--bg-card)] text-sm text-[var(--text-muted)]">
                            No results found for this query
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)]">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
                                            <th className="px-4 py-3 font-medium">Name</th>
                                            <th className="px-4 py-3 font-medium">Title</th>
                                            <th className="px-4 py-3 font-medium">Company</th>
                                            <th className="px-4 py-3 font-medium">Location</th>
                                            <th className="px-4 py-3 font-medium">Contact</th>
                                            <th className="px-4 py-3 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((lead) => (
                                            <tr
                                                key={lead.id}
                                                className="border-b border-white/6 text-[var(--text-primary)] transition-colors hover:bg-white/[0.02]"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-300">
                                                            {lead.firstName.charAt(0)}
                                                            {lead.lastName.charAt(0)}
                                                        </div>
                                                        <span className="font-medium">
                                                            {lead.firstName} {lead.lastName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-[var(--text-secondary)]">
                                                    {lead.title || "—"}
                                                </td>
                                                <td className="px-4 py-3 text-[var(--text-secondary)]">
                                                    {lead.company || "—"}
                                                </td>
                                                <td className="px-4 py-3 text-[var(--text-secondary)]">
                                                    {lead.location || "—"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1.5">
                                                        {lead.email && (
                                                            <Mail className="h-3.5 w-3.5 text-green-400" />
                                                        )}
                                                        {lead.phone && (
                                                            <Phone className="h-3.5 w-3.5 text-blue-400" />
                                                        )}
                                                        {!lead.email && !lead.phone && (
                                                            <span className="text-xs text-[var(--text-muted)]">
                                                                —
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1">
                                                        {lead.linkedinUrl && (
                                                            <a
                                                                href={lead.linkedinUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="rounded p-1 transition-colors hover:bg-white/10"
                                                                title="View LinkedIn"
                                                            >
                                                                <ExternalLink className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                                                            </a>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleSaveLead(lead)
                                                            }
                                                            disabled={savingIds.has(lead.id)}
                                                            className="rounded p-1 transition-colors hover:bg-purple-500/10"
                                                            title="Save to database"
                                                        >
                                                            {savingIds.has(lead.id) ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
                                                            ) : (
                                                                <Plus className="h-3.5 w-3.5 text-purple-400" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Recent Extractions */}
            {!hasSearched && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">
                            Recently Extracted Leads
                        </h3>
                        {recentTotal > 0 && (
                            <Badge className="border-white/10 bg-white/5 text-[var(--text-secondary)] text-[10px]">
                                {recentTotal} total
                            </Badge>
                        )}
                    </div>

                    {recentLeads.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title="No extractions yet"
                            description="Click 'Extract Leads' to start finding new leads."
                        />
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)]">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
                                            <th className="px-4 py-3 font-medium">Name</th>
                                            <th className="px-4 py-3 font-medium">Title</th>
                                            <th className="px-4 py-3 font-medium">Company</th>
                                            <th className="px-4 py-3 font-medium">Location</th>
                                            <th className="px-4 py-3 font-medium">Contact</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentLeads.map((lead) => (
                                            <tr
                                                key={lead.id}
                                                className="border-b border-white/6 text-[var(--text-primary)] transition-colors hover:bg-white/[0.02]"
                                            >
                                                <td className="px-4 py-3 font-medium">
                                                    {lead.firstName} {lead.lastName}
                                                </td>
                                                <td className="px-4 py-3 text-[var(--text-secondary)]">
                                                    {lead.title || "—"}
                                                </td>
                                                <td className="px-4 py-3 text-[var(--text-secondary)]">
                                                    {lead.company || "—"}
                                                </td>
                                                <td className="px-4 py-3 text-[var(--text-secondary)]">
                                                    {lead.location || "—"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-1.5">
                                                        {lead.email && (
                                                            <Mail className="h-3.5 w-3.5 text-green-400" />
                                                        )}
                                                        {lead.phone && (
                                                            <Phone className="h-3.5 w-3.5 text-blue-400" />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
