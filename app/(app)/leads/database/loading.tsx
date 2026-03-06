// Copyright (c) Said Borna. All rights reserved.
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Lead Database loading skeleton — filter panel + table/grid.
 */
export default function LeadDatabaseLoading() {
    return (
        <div className="flex gap-6">
            {/* Filter panel */}
            <div className="hidden w-64 shrink-0 space-y-4 lg:block">
                <Skeleton className="h-5 w-24" />
                {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-9 w-full rounded-lg" />
                    </div>
                ))}
                <Skeleton className="h-10 w-full rounded-lg" />
            </div>

            {/* Main content */}
            <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-36" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-10 w-32 rounded-lg" />
                    </div>
                </div>

                {/* Search bar */}
                <Skeleton className="h-10 w-full rounded-lg" />

                {/* Grid cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 9 }, (_, i) => (
                        <div key={i} className="rounded-xl border border-white/[0.06] bg-[var(--bg-card)] p-4 space-y-3">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-1 flex-1">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-3 w-40" />
                                </div>
                            </div>
                            <Skeleton className="h-3 w-24" />
                            <div className="flex gap-2">
                                <Skeleton className="h-5 w-16 rounded-full" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
