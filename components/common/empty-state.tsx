// Copyright (c) Said Borna. All rights reserved.
import Link from "next/link";
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
    /** Icon component from lucide-react. */
    icon: LucideIcon;
    /** Primary heading text. */
    title: string;
    /** Description text shown below heading. */
    description: string;
    /** Optional CTA button text. */
    actionLabel?: string;
    /** Optional CTA link href. */
    actionHref?: string;
    /** Optional onClick handler for the CTA button (alternative to href). */
    onAction?: () => void;
}

/**
 * Reusable empty state card — centered icon + heading + description + optional CTA.
 * Matches dark theme design system.
 */
export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    onAction,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.04]">
                <Icon className="h-7 w-7 text-[var(--text-muted)]" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">
                {title}
            </h3>
            <p className="mb-6 max-w-sm text-sm text-[var(--text-secondary)]">
                {description}
            </p>
            {actionLabel && actionHref && (
                <Link
                    href={actionHref}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:brightness-110 hover:-translate-y-[1px] focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0713]"
                >
                    {actionLabel}
                </Link>
            )}
            {actionLabel && onAction && !actionHref && (
                <button
                    onClick={onAction}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/20 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:brightness-110 hover:-translate-y-[1px] focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0713]"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
