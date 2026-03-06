// Copyright (c) Said Borna. All rights reserved.
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** Breadcrumb segment label overrides. */
const SEGMENT_LABELS: Record<string, string> = {
    dashboard: "Dashboard",
    unibox: "Unibox",
    linkedin: "LinkedIn",
    accounts: "Accounts",
    campaigns: "Campaigns",
    leads: "Leads",
    extractor: "Lead Extractor",
    database: "Lead Database",
    content: "Content",
    assistant: "Content Assistant",
    automations: "Automations",
    inbound: "Inbound Automations",
    integrations: "Integrations",
    academy: "Academy",
    settings: "Settings",
    new: "New Campaign",
    create: "Create",
};

/**
 * Builds breadcrumbs from the current pathname.
 */
function buildBreadcrumbs(pathname: string): Array<{ label: string; href: string }> {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: Array<{ label: string; href: string }> = [];

    let currentPath = "";
    for (const segment of segments) {
        currentPath += `/${segment}`;
        const label = SEGMENT_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        crumbs.push({ label, href: currentPath });
    }

    return crumbs;
}

/**
 * Top bar with breadcrumb navigation.
 */
export function TopBar() {
    const pathname = usePathname();
    const breadcrumbs = buildBreadcrumbs(pathname);

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-white/6 bg-[var(--bg-primary)]/80 px-6 backdrop-blur-sm">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
                {breadcrumbs.map((crumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    return (
                        <div key={crumb.href} className="flex items-center gap-1.5">
                            {index > 0 && (
                                <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                            )}
                            {isLast ? (
                                <span className="text-sm font-medium text-[var(--text-primary)]">
                                    {crumb.label}
                                </span>
                            ) : (
                                <Link
                                    href={crumb.href}
                                    className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                                >
                                    {crumb.label}
                                </Link>
                            )}
                        </div>
                    );
                })}
            </nav>
        </header>
    );
}
