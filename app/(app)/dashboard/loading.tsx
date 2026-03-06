// Copyright (c) Said Borna. All rights reserved.
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard loading skeleton — KPI cards, chart area, table rows.
 */
export default function DashboardLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-20 rounded-lg" />
                    <Skeleton className="h-9 w-20 rounded-lg" />
                    <Skeleton className="h-9 w-20 rounded-lg" />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="rounded-xl border border-white/[0.06] bg-[var(--bg-card)] p-5">
                        <Skeleton className="mb-2 h-1 w-10 rounded-full" />
                        <Skeleton className="mb-1 h-8 w-20" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                ))}
            </div>

            {/* Chart + Funnel */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="col-span-2 rounded-xl border border-white/[0.06] bg-[var(--bg-card)] p-6">
                    <Skeleton className="mb-4 h-5 w-36" />
                    <Skeleton className="h-48 w-full rounded-lg" />
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[var(--bg-card)] p-6">
                    <Skeleton className="mb-4 h-5 w-36" />
                    <div className="space-y-4">
                        {Array.from({ length: 4 }, (_, i) => (
                            <div key={i}>
                                <Skeleton className="mb-1 h-3 w-24" />
                                <Skeleton className="h-3 w-full rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-white/[0.06] bg-[var(--bg-card)] p-6">
                <Skeleton className="mb-4 h-5 w-40" />
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    {Array.from({ length: 4 }, (_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        </div>
    );
}
