// Copyright (c) Said Borna. All rights reserved.
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowUpDown,
    ExternalLink,
    Mail,
    Phone,
    Star,
    UserPlus,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */

export interface LeadRow {
    id: string;
    firstName: string;
    lastName: string;
    title: string;
    company: string;
    companyLogo: string;
    location: string;
    email: string | null;
    phone: string | null;
    linkedinUrl: string;
    avatarUrl: string;
    icpScore: number | null;
    source: "csv" | "extractor" | "database" | "inbound";
    tags: string[];
}

interface LeadTableProps {
    leads: LeadRow[];
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    sortKey: SortKey;
    sortDir: "asc" | "desc";
    onSort: (key: SortKey) => void;
}

export type SortKey = "name" | "title" | "company" | "location" | "icpScore";

/* ─── ICP badge ─────────────────────────────────────── */

function IcpBadge({ score }: { score: number | null }) {
    if (score === null) return <span className="text-xs text-[var(--text-muted)]">—</span>;

    let color = "border-red-500/30 bg-red-500/15 text-red-300";
    let label = "Low";
    if (score >= 80) {
        color = "border-green-500/30 bg-green-500/15 text-green-300";
        label = "High";
    } else if (score >= 50) {
        color = "border-amber-500/30 bg-amber-500/15 text-amber-300";
        label = "Medium";
    }

    return (
        <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-[var(--text-primary)]">
                {score}
            </span>
            <Badge variant="outline" className={`text-xs ${color}`}>
                {label}
            </Badge>
        </div>
    );
}

/* ─── Contact icons ─────────────────────────────────── */

function ContactIcons({
    email,
    phone,
}: {
    email: string | null;
    phone: string | null;
}) {
    return (
        <div className="flex items-center gap-2">
            <Mail
                className={`h-4 w-4 ${email
                        ? "text-green-400"
                        : "text-[var(--text-muted)] opacity-40"
                    }`}
            />
            <Phone
                className={`h-4 w-4 ${phone
                        ? "text-green-400"
                        : "text-[var(--text-muted)] opacity-40"
                    }`}
            />
        </div>
    );
}

/* ─── Sort header ───────────────────────────────────── */

function SortHeader({
    label,
    sortKey: key,
    currentKey,
    currentDir,
    onSort,
}: {
    label: string;
    sortKey: SortKey;
    currentKey: SortKey;
    currentDir: "asc" | "desc";
    onSort: (key: SortKey) => void;
}) {
    const isActive = currentKey === key;
    return (
        <button
            onClick={() => onSort(key)}
            className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
            {label}
            <ArrowUpDown
                className={`h-3 w-3 ${isActive ? "text-purple-400" : "text-[var(--text-muted)]"
                    }`}
            />
            {isActive && (
                <span className="text-[10px] text-purple-400">
                    {currentDir === "asc" ? "↑" : "↓"}
                </span>
            )}
        </button>
    );
}

/* ─── Main component ────────────────────────────────── */

/**
 * Data table for displaying leads with sortable columns,
 * ICP scoring badges, contact indicators, and pagination.
 */
export function LeadTable({
    leads,
    page,
    pageSize,
    total,
    onPageChange,
    sortKey,
    sortDir,
    onSort,
}: LeadTableProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="flex flex-1 flex-col">
            {/* Table */}
            <div className="flex-1 overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/6">
                            <th className="px-4 py-3 text-left">
                                <SortHeader
                                    label="Name"
                                    sortKey="name"
                                    currentKey={sortKey}
                                    currentDir={sortDir}
                                    onSort={onSort}
                                />
                            </th>
                            <th className="px-4 py-3 text-left">
                                <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                                    Contact
                                </span>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <SortHeader
                                    label="Title"
                                    sortKey="title"
                                    currentKey={sortKey}
                                    currentDir={sortDir}
                                    onSort={onSort}
                                />
                            </th>
                            <th className="px-4 py-3 text-left">
                                <SortHeader
                                    label="Company"
                                    sortKey="company"
                                    currentKey={sortKey}
                                    currentDir={sortDir}
                                    onSort={onSort}
                                />
                            </th>
                            <th className="px-4 py-3 text-left">
                                <SortHeader
                                    label="Location"
                                    sortKey="location"
                                    currentKey={sortKey}
                                    currentDir={sortDir}
                                    onSort={onSort}
                                />
                            </th>
                            <th className="px-4 py-3 text-left">
                                <SortHeader
                                    label="ICP Score"
                                    sortKey="icpScore"
                                    currentKey={sortKey}
                                    currentDir={sortDir}
                                    onSort={onSort}
                                />
                            </th>
                            <th className="px-4 py-3 text-left">
                                <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                                    Actions
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={7}
                                    className="px-4 py-12 text-center text-sm text-[var(--text-muted)]"
                                >
                                    No leads match your filters.
                                </td>
                            </tr>
                        ) : (
                            leads.map((lead) => (
                                <tr
                                    key={lead.id}
                                    className="border-b border-white/4 hover:bg-white/3 transition-colors"
                                >
                                    {/* Name */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-purple-700/20 text-sm font-medium text-purple-300">
                                                {lead.firstName[0]}
                                                {lead.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[var(--text-primary)]">
                                                    {lead.firstName}{" "}
                                                    {lead.lastName}
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    {lead.title}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="px-4 py-3">
                                        <ContactIcons
                                            email={lead.email}
                                            phone={lead.phone}
                                        />
                                    </td>

                                    {/* Title */}
                                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                                        {lead.title}
                                    </td>

                                    {/* Company */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded bg-white/5 text-[10px] font-bold text-[var(--text-muted)]">
                                                {lead.company[0]}
                                            </div>
                                            <span className="text-sm text-[var(--text-primary)]">
                                                {lead.company}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Location */}
                                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                                        {lead.location}
                                    </td>

                                    {/* ICP Score */}
                                    <td className="px-4 py-3">
                                        <IcpBadge score={lead.icpScore} />
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-[var(--text-muted)] hover:text-purple-400"
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
                                                <UserPlus className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-[var(--text-muted)] hover:text-amber-400"
                                                title="Star"
                                            >
                                                <Star className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-white/6 px-4 py-3">
                <p className="text-xs text-[var(--text-muted)]">
                    Showing page {page} of {totalPages} ({leads.length} leads on
                    this page, {total.toLocaleString()} total)
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => onPageChange(page - 1)}
                        className="h-7 border-white/10 bg-white/5 text-xs text-[var(--text-secondary)] hover:bg-white/10 disabled:opacity-40"
                    >
                        Previous
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const p = i + 1;
                        return (
                            <Button
                                key={p}
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(p)}
                                className={`h-7 w-7 border-white/10 p-0 text-xs ${p === page
                                        ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                        : "bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"
                                    }`}
                            >
                                {p}
                            </Button>
                        );
                    })}
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => onPageChange(page + 1)}
                        className="h-7 border-white/10 bg-white/5 text-xs text-[var(--text-secondary)] hover:bg-white/10 disabled:opacity-40"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
