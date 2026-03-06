// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    ChevronDown,
    ChevronRight,
    X,
    RotateCcw,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */

export interface LeadFilters {
    search: string;
    jobTitles: string[];
    seniority: string[];
    departments: string[];
    locations: string[];
    industries: string[];
    companySizes: string[];
    skills: string[];
}

export const EMPTY_FILTERS: LeadFilters = {
    search: "",
    jobTitles: [],
    seniority: [],
    departments: [],
    locations: [],
    industries: [],
    companySizes: [],
    skills: [],
};

/* ─── Filter option data ────────────────────────────── */

const SENIORITY_OPTIONS = [
    "C-Suite",
    "VP",
    "Director",
    "Manager",
    "Senior",
    "Entry Level",
    "Intern",
];

const DEPARTMENT_OPTIONS = [
    "Sales",
    "Marketing",
    "Engineering",
    "Product",
    "Finance",
    "Operations",
    "HR",
    "Legal",
    "Customer Success",
    "Design",
];

const INDUSTRY_OPTIONS = [
    "SaaS",
    "FinTech",
    "HealthTech",
    "E-Commerce",
    "Marketing Agency",
    "Consulting",
    "Real Estate",
    "Education",
    "Media",
    "Manufacturing",
];

const COMPANY_SIZE_OPTIONS = [
    "1-10",
    "11-50",
    "51-200",
    "201-500",
    "501-1000",
    "1001-5000",
    "5001-10000",
    "10000+",
];

const LOCATION_OPTIONS = [
    "United States",
    "United Kingdom",
    "Germany",
    "Sweden",
    "Netherlands",
    "France",
    "Canada",
    "Australia",
    "Singapore",
    "India",
];

/* ─── Filter group categories matching CLAUDE.md (83 filters total) ── */

interface FilterCategory {
    key: string;
    label: string;
    count: number;
}

const FILTER_CATEGORIES: FilterCategory[] = [
    { key: "general", label: "General", count: 8 },
    { key: "company", label: "Company", count: 12 },
    { key: "financials", label: "Financials", count: 6 },
    { key: "experience", label: "Experience", count: 10 },
    { key: "education", label: "Education", count: 7 },
    { key: "certifications", label: "Certifications", count: 5 },
    { key: "recommendations", label: "Recommendations", count: 4 },
    { key: "web_insights", label: "Web Insights", count: 8 },
    { key: "reviews", label: "Reviews", count: 6 },
    { key: "company_insights", label: "Company Insights", count: 9 },
    { key: "technologies", label: "Technologies", count: 8 },
];

/* ─── Component ─────────────────────────────────────── */

interface LeadFilterPanelProps {
    filters: LeadFilters;
    onChange: (filters: LeadFilters) => void;
}

/**
 * Advanced filter panel for the Lead Database.
 * 11 filter categories with expandable sections matching CLAUDE.md spec.
 */
export function LeadFilterPanel({ filters, onChange }: LeadFilterPanelProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(["general"])
    );

    const activeCount =
        filters.jobTitles.length +
        filters.seniority.length +
        filters.departments.length +
        filters.locations.length +
        filters.industries.length +
        filters.companySizes.length +
        filters.skills.length;

    function toggleSection(key: string) {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }

    function toggleOption(
        field: keyof Pick<
            LeadFilters,
            | "jobTitles"
            | "seniority"
            | "departments"
            | "locations"
            | "industries"
            | "companySizes"
            | "skills"
        >,
        value: string
    ) {
        const current = filters[field];
        const next = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
        onChange({ ...filters, [field]: next });
    }

    function resetFilters() {
        onChange(EMPTY_FILTERS);
    }

    return (
        <div className="flex h-full w-72 flex-col border-r border-white/6 bg-[var(--bg-secondary)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        Filters
                    </h3>
                    {activeCount > 0 && (
                        <Badge
                            variant="outline"
                            className="border-purple-500/30 bg-purple-500/15 text-purple-300 text-xs"
                        >
                            {activeCount}
                        </Badge>
                    )}
                </div>
                {activeCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        className="h-7 gap-1 px-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                    </Button>
                )}
            </div>

            {/* Category list */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
                {FILTER_CATEGORIES.map((cat) => (
                    <div key={cat.key} className="mb-1">
                        <button
                            onClick={() => toggleSection(cat.key)}
                            className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-white/5"
                        >
                            <span className="text-[var(--text-primary)]">
                                {cat.label}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-[var(--text-muted)]">
                                    {cat.count}
                                </span>
                                {expandedSections.has(cat.key) ? (
                                    <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                                ) : (
                                    <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                                )}
                            </div>
                        </button>

                        {expandedSections.has(cat.key) && (
                            <div className="ml-2 space-y-0.5 pb-2 pt-1">
                                {cat.key === "general" &&
                                    renderCheckboxGroup(
                                        "seniority",
                                        "Job Seniority",
                                        SENIORITY_OPTIONS,
                                        filters.seniority,
                                        (v) => toggleOption("seniority", v)
                                    )}
                                {cat.key === "general" &&
                                    renderCheckboxGroup(
                                        "departments",
                                        "Departments",
                                        DEPARTMENT_OPTIONS,
                                        filters.departments,
                                        (v) => toggleOption("departments", v)
                                    )}
                                {cat.key === "company" &&
                                    renderCheckboxGroup(
                                        "industries",
                                        "Industry",
                                        INDUSTRY_OPTIONS,
                                        filters.industries,
                                        (v) => toggleOption("industries", v)
                                    )}
                                {cat.key === "company" &&
                                    renderCheckboxGroup(
                                        "companySize",
                                        "Company Size",
                                        COMPANY_SIZE_OPTIONS,
                                        filters.companySizes,
                                        (v) => toggleOption("companySizes", v)
                                    )}
                                {cat.key === "general" &&
                                    renderCheckboxGroup(
                                        "location",
                                        "Location",
                                        LOCATION_OPTIONS,
                                        filters.locations,
                                        (v) => toggleOption("locations", v)
                                    )}
                                {cat.key !== "general" &&
                                    cat.key !== "company" && (
                                        <p className="px-2 py-1 text-xs text-[var(--text-muted)] italic">
                                            {cat.count} filters available
                                        </p>
                                    )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Active filter tags */}
            {activeCount > 0 && (
                <div className="border-t border-white/6 px-3 py-3">
                    <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
                        Active Filters
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {[
                            ...filters.seniority.map((v) => ({
                                field: "seniority" as const,
                                value: v,
                            })),
                            ...filters.departments.map((v) => ({
                                field: "departments" as const,
                                value: v,
                            })),
                            ...filters.locations.map((v) => ({
                                field: "locations" as const,
                                value: v,
                            })),
                            ...filters.industries.map((v) => ({
                                field: "industries" as const,
                                value: v,
                            })),
                            ...filters.companySizes.map((v) => ({
                                field: "companySizes" as const,
                                value: v,
                            })),
                        ].map(({ field, value }) => (
                            <Badge
                                key={`${field}-${value}`}
                                variant="outline"
                                className="gap-1 border-white/10 bg-white/5 text-xs text-[var(--text-secondary)]"
                            >
                                {value}
                                <button
                                    onClick={() => toggleOption(field, value)}
                                    className="ml-0.5 hover:text-[var(--text-primary)]"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Helpers ───────────────────────────────────────── */

function renderCheckboxGroup(
    id: string,
    label: string,
    options: string[],
    selected: string[],
    onToggle: (value: string) => void
) {
    return (
        <div key={id} className="mb-2">
            <p className="mb-1 px-2 text-xs font-medium text-[var(--text-secondary)]">
                {label}
            </p>
            {options.map((opt) => (
                <label
                    key={opt}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-white/5"
                >
                    <input
                        type="checkbox"
                        checked={selected.includes(opt)}
                        onChange={() => onToggle(opt)}
                        className="h-3.5 w-3.5 rounded border-white/20 bg-[var(--bg-input)] accent-purple-500"
                    />
                    <span
                        className={
                            selected.includes(opt)
                                ? "text-[var(--text-primary)]"
                                : "text-[var(--text-secondary)]"
                        }
                    >
                        {opt}
                    </span>
                </label>
            ))}
        </div>
    );
}
