// Copyright (c) Said Borna. All rights reserved.
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Campaigns list loading skeleton — header, search bar, table rows.
 */
export default function CampaignsLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-36" />
                    <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-10 w-48 rounded-lg" />
            </div>

            {/* Search + Filters */}
            <div className="flex gap-3">
                <Skeleton className="h-10 w-64 rounded-lg" />
                {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="h-10 w-20 rounded-lg" />
                ))}
            </div>

            {/* Table */}
            <div className="rounded-xl border border-white/[0.06] bg-[var(--bg-card)] overflow-hidden">
                <Skeleton className="h-11 w-full" />
                {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="border-t border-white/[0.04] px-4 py-3">
                        <Skeleton className="h-10 w-full rounded" />
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24 rounded-lg" />
                    <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
            </div>
        </div>
    );
}
