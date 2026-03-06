// Copyright (c) Said Borna. All rights reserved.
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Integrations loading skeleton — tab bar + integration cards.
 */
export default function IntegrationsLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-7 w-36" />
                <Skeleton className="h-4 w-64" />
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <Skeleton className="h-9 w-20 rounded-full" />
                <Skeleton className="h-9 w-24 rounded-full" />
                <Skeleton className="h-9 w-24 rounded-full" />
            </div>

            {/* Integration cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="rounded-xl border border-white/[0.06] bg-[var(--bg-card)] p-5 space-y-3">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-9 w-24 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}
