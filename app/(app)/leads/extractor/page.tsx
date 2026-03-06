// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Download,
    ExternalLink,
    Linkedin,
    Loader2,
    Mail,
    Phone,
    Plus,
    Search,
    Sparkles,
    Users,
    X,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */

type ExtractionSource = "search" | "post" | "sales_navigator";
type ExtractionStatus = "completed" | "running" | "queued" | "failed";

interface ExtractionJob {
    id: string;
    source: ExtractionSource;
    query: string;
    status: ExtractionStatus;
    leadsFound: number;
    leadsEnriched: number;
    startedAt: string;
    completedAt: string | null;
    duplicatesSkipped: number;
}

interface ExtractedLead {
    id: string;
    name: string;
    title: string;
    company: string;
    location: string;
    hasEmail: boolean;
    hasPhone: boolean;
    linkedinUrl: string;
    qualityScore: number;
}

/* ─── Mock data ─────────────────────────────────────── */

const MOCK_JOBS: ExtractionJob[] = [
    { id: "e1", source: "search", query: "SaaS CEO Stockholm 2-15 employees", status: "completed", leadsFound: 342, leadsEnriched: 342, startedAt: "2026-03-05 14:30", completedAt: "2026-03-05 14:45", duplicatesSkipped: 18 },
    { id: "e2", source: "post", query: "https://linkedin.com/posts/elliot-nestenborg_...", status: "completed", leadsFound: 127, leadsEnriched: 127, startedAt: "2026-03-04 09:15", completedAt: "2026-03-04 09:22", duplicatesSkipped: 5 },
    { id: "e3", source: "sales_navigator", query: "Marketing Director DACH region B2B SaaS", status: "running", leadsFound: 89, leadsEnriched: 56, startedAt: "2026-03-06 10:00", completedAt: null, duplicatesSkipped: 3 },
    { id: "e4", source: "search", query: "VP Sales Fintech Europe", status: "queued", leadsFound: 0, leadsEnriched: 0, startedAt: "2026-03-06 10:05", completedAt: null, duplicatesSkipped: 0 },
    { id: "e5", source: "search", query: "Agency Owner Digital Marketing US", status: "failed", leadsFound: 0, leadsEnriched: 0, startedAt: "2026-03-03 16:00", completedAt: "2026-03-03 16:01", duplicatesSkipped: 0 },
];

const MOCK_EXTRACTED: ExtractedLead[] = [
    { id: "x1", name: "Alexander Svensson", title: "CEO", company: "GrowthStack", location: "Stockholm", hasEmail: true, hasPhone: true, linkedinUrl: "#", qualityScore: 94 },
    { id: "x2", name: "Maria Andersson", title: "Co-Founder", company: "LeadEngine", location: "Gothenburg", hasEmail: true, hasPhone: false, linkedinUrl: "#", qualityScore: 88 },
    { id: "x3", name: "John Smith", title: "CTO", company: "DataSync AI", location: "London", hasEmail: true, hasPhone: true, linkedinUrl: "#", qualityScore: 82 },
    { id: "x4", name: "Lena Müller", title: "VP Sales", company: "SalesPipe", location: "Berlin", hasEmail: false, hasPhone: false, linkedinUrl: "#", qualityScore: 71 },
    { id: "x5", name: "Chris Johnson", title: "Founder", company: "ScaleUp Labs", location: "San Francisco", hasEmail: true, hasPhone: true, linkedinUrl: "#", qualityScore: 96 },
];

const SOURCE_CONFIG: Record<ExtractionSource, { label: string; description: string }> = {
    search: { label: "LinkedIn Search", description: "Extract from LinkedIn search results URL" },
    post: { label: "LinkedIn Post", description: "Extract from post commenters and likers" },
    sales_navigator: { label: "Sales Navigator", description: "Extract from Sales Navigator search" },
};

const STATUS_STYLES: Record<ExtractionStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
    completed: { icon: CheckCircle2, color: "text-green-400", label: "Completed" },
    running: { icon: Loader2, color: "text-amber-400", label: "Running" },
    queued: { icon: Clock, color: "text-blue-400", label: "Queued" },
    failed: { icon: AlertCircle, color: "text-red-400", label: "Failed" },
};

/**
 * Lead Extractor page — extract leads from LinkedIn searches, posts, and Sales Navigator.
 * Shows extraction wizard, real-time progress, and results with enrichment.
 */
export default function LeadExtractorPage() {
    const [showWizard, setShowWizard] = useState(false);
    const [selectedSource, setSelectedSource] = useState<ExtractionSource>("search");
    const [extractUrl, setExtractUrl] = useState("");
    const [maxLeads, setMaxLeads] = useState("500");
    const [selectedJob, setSelectedJob] = useState<string | null>("e1");

    const activeJob = MOCK_JOBS.find((j) => j.id === selectedJob);

    return (
        <div className="flex h-full flex-1 flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-white/6 px-6 py-4">
                <div>
                    <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                        Lead Extractor
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Extract and enrich leads from LinkedIn searches, posts, and Sales Navigator
                    </p>
                </div>
                <Button
                    onClick={() => setShowWizard(!showWizard)}
                    className="gap-1.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400"
                >
                    <Plus className="h-4 w-4" />
                    Extract Leads
                </Button>
            </div>

            {/* Extraction wizard */}
            {showWizard && (
                <div className="border-b border-white/6 bg-[var(--bg-card)] px-6 py-5">
                    <div className="mx-auto max-w-2xl space-y-4">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                            New Extraction
                        </h3>

                        {/* Source selection */}
                        <div className="grid grid-cols-3 gap-3">
                            {(Object.entries(SOURCE_CONFIG) as [ExtractionSource, typeof SOURCE_CONFIG.search][]).map(
                                ([key, cfg]) => (
                                    <button
                                        key={key}
                                        onClick={() => setSelectedSource(key)}
                                        className={`rounded-xl border p-3 text-left transition-colors ${selectedSource === key
                                                ? "border-purple-500/40 bg-purple-500/10"
                                                : "border-white/6 bg-white/3 hover:border-white/10"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Linkedin
                                                className={`h-4 w-4 ${selectedSource === key
                                                        ? "text-purple-400"
                                                        : "text-[var(--text-muted)]"
                                                    }`}
                                            />
                                            <span className="text-sm font-medium text-[var(--text-primary)]">
                                                {cfg.label}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                                            {cfg.description}
                                        </p>
                                    </button>
                                )
                            )}
                        </div>

                        {/* URL input */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[var(--text-secondary)]">
                                {selectedSource === "post"
                                    ? "LinkedIn Post URL"
                                    : "Search URL or Query"}
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                                <Input
                                    placeholder={
                                        selectedSource === "post"
                                            ? "https://linkedin.com/posts/..."
                                            : "Paste LinkedIn search URL or describe your target..."
                                    }
                                    value={extractUrl}
                                    onChange={(e) => setExtractUrl(e.target.value)}
                                    className="h-10 border-white/10 bg-[var(--bg-input)] pl-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:ring-purple-500/20"
                                />
                            </div>
                        </div>

                        {/* Max leads + actions */}
                        <div className="flex items-end gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[var(--text-secondary)]">
                                    Max Leads
                                </label>
                                <Input
                                    type="number"
                                    value={maxLeads}
                                    onChange={(e) => setMaxLeads(e.target.value)}
                                    className="h-10 w-28 border-white/10 bg-[var(--bg-input)] text-sm text-[var(--text-primary)] focus:border-purple-500/50 focus:ring-purple-500/20"
                                />
                            </div>
                            <div className="flex flex-1 items-center gap-3">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        defaultChecked
                                        className="h-4 w-4 rounded border-white/20 bg-[var(--bg-input)] accent-purple-500"
                                    />
                                    <span className="text-[var(--text-secondary)]">
                                        Auto-enrich contacts
                                    </span>
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        defaultChecked
                                        className="h-4 w-4 rounded border-white/20 bg-[var(--bg-input)] accent-purple-500"
                                    />
                                    <span className="text-[var(--text-secondary)]">
                                        Skip duplicates
                                    </span>
                                </label>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowWizard(false)}
                                    className="h-10 border-white/10 text-[var(--text-secondary)] hover:bg-white/5"
                                >
                                    Cancel
                                </Button>
                                <Button className="h-10 gap-1.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Start Extraction
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main content — split view */}
            <div className="flex flex-1 overflow-hidden">
                {/* Jobs list */}
                <div className="w-96 flex-shrink-0 border-r border-white/6 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-white/6">
                        <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                            Extraction History
                        </h3>
                    </div>
                    {MOCK_JOBS.map((job) => {
                        const statusCfg = STATUS_STYLES[job.status];
                        const StatusIcon = statusCfg.icon;
                        return (
                            <button
                                key={job.id}
                                onClick={() => setSelectedJob(job.id)}
                                className={`w-full border-b border-white/4 px-4 py-3 text-left transition-colors ${selectedJob === job.id
                                        ? "bg-purple-500/10 border-l-2 border-l-purple-500"
                                        : "hover:bg-white/3"
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                            {job.query}
                                        </p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] border-white/10 text-[var(--text-muted)]"
                                            >
                                                {SOURCE_CONFIG[job.source].label}
                                            </Badge>
                                            <span className="text-xs text-[var(--text-muted)]">
                                                {job.startedAt}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 ml-2">
                                        <StatusIcon
                                            className={`h-4 w-4 ${statusCfg.color} ${job.status === "running"
                                                    ? "animate-spin"
                                                    : ""
                                                }`}
                                        />
                                        <span className={`text-xs ${statusCfg.color}`}>
                                            {statusCfg.label}
                                        </span>
                                    </div>
                                </div>
                                {job.status !== "queued" && (
                                    <div className="mt-2 flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {job.leadsFound} found
                                        </span>
                                        {job.duplicatesSkipped > 0 && (
                                            <span className="text-amber-400/70">
                                                {job.duplicatesSkipped} duplicates skipped
                                            </span>
                                        )}
                                        {job.status === "running" && (
                                            <div className="flex-1">
                                                <div className="h-1.5 rounded-full bg-white/10">
                                                    <div
                                                        className="h-1.5 rounded-full bg-purple-500 transition-all"
                                                        style={{
                                                            width: `${job.leadsFound > 0
                                                                    ? Math.round(
                                                                        (job.leadsEnriched /
                                                                            job.leadsFound) *
                                                                        100
                                                                    )
                                                                    : 0
                                                                }%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Results panel */}
                <div className="flex flex-1 flex-col">
                    {activeJob ? (
                        <>
                            {/* Job detail header */}
                            <div className="flex items-center justify-between border-b border-white/6 px-6 py-3">
                                <div>
                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                        {activeJob.query}
                                    </p>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        {activeJob.leadsFound} leads found
                                        {activeJob.leadsEnriched > 0 &&
                                            ` · ${activeJob.leadsEnriched} enriched`}
                                        {activeJob.completedAt &&
                                            ` · completed ${activeJob.completedAt}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 gap-1 border-white/10 bg-white/5 text-xs text-[var(--text-secondary)] hover:bg-white/10"
                                    >
                                        <Download className="h-3 w-3" />
                                        Export
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-7 gap-1 bg-purple-500/20 text-purple-300 text-xs hover:bg-purple-500/30"
                                    >
                                        <Plus className="h-3 w-3" />
                                        Add to Campaign
                                    </Button>
                                </div>
                            </div>

                            {/* Enrichment stats */}
                            {activeJob.status === "completed" && (
                                <div className="grid grid-cols-4 gap-4 border-b border-white/6 px-6 py-3">
                                    {[
                                        {
                                            label: "Leads Found",
                                            value: activeJob.leadsFound,
                                            icon: Users,
                                            color: "text-blue-400",
                                        },
                                        {
                                            label: "Enriched",
                                            value: activeJob.leadsEnriched,
                                            icon: Sparkles,
                                            color: "text-purple-400",
                                        },
                                        {
                                            label: "With Email",
                                            value: Math.round(activeJob.leadsFound * 0.72),
                                            icon: Mail,
                                            color: "text-green-400",
                                        },
                                        {
                                            label: "With Phone",
                                            value: Math.round(activeJob.leadsFound * 0.38),
                                            icon: Phone,
                                            color: "text-teal-400",
                                        },
                                    ].map((stat) => (
                                        <div
                                            key={stat.label}
                                            className="flex items-center gap-3 rounded-lg border border-white/6 bg-white/3 px-3 py-2"
                                        >
                                            <stat.icon
                                                className={`h-4 w-4 ${stat.color}`}
                                            />
                                            <div>
                                                <p className="text-lg font-semibold text-[var(--text-primary)]">
                                                    {stat.value}
                                                </p>
                                                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                                                    {stat.label}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Results table */}
                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/6">
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                                                Name
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                                                Title
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                                                Company
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                                                Location
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                                                Contact
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                                                Quality
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {MOCK_EXTRACTED.map((lead) => (
                                            <tr
                                                key={lead.id}
                                                className="border-b border-white/4 hover:bg-white/3 transition-colors"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-purple-700/20 text-xs font-medium text-purple-300">
                                                            {lead.name
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")}
                                                        </div>
                                                        <span className="text-sm font-medium text-[var(--text-primary)]">
                                                            {lead.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                                                    {lead.title}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                                                    {lead.company}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                                                    {lead.location}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Mail
                                                            className={`h-4 w-4 ${lead.hasEmail
                                                                    ? "text-green-400"
                                                                    : "text-[var(--text-muted)] opacity-40"
                                                                }`}
                                                        />
                                                        <Phone
                                                            className={`h-4 w-4 ${lead.hasPhone
                                                                    ? "text-green-400"
                                                                    : "text-[var(--text-muted)] opacity-40"
                                                                }`}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs ${lead.qualityScore >= 80
                                                                ? "border-green-500/30 bg-green-500/15 text-green-300"
                                                                : lead.qualityScore >= 60
                                                                    ? "border-amber-500/30 bg-amber-500/15 text-amber-300"
                                                                    : "border-red-500/30 bg-red-500/15 text-red-300"
                                                            }`}
                                                    >
                                                        {lead.qualityScore}%
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-[var(--text-muted)] hover:text-blue-400"
                                                            title="View LinkedIn"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-[var(--text-muted)] hover:text-purple-400"
                                                            title="Add to Campaign"
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-1 items-center justify-center">
                            <div className="text-center">
                                <Search className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" />
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Select an extraction to view results
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
