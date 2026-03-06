// Copyright (c) Said Borna. All rights reserved.
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Lead Extractor loading skeleton — wizard + jobs list + results table.
 */
export default function LeadExtractorLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-36 rounded-lg" />
            </div>

            {/* Split view */}
            <div className="flex gap-6">
                {/* Jobs list */}
                <div className="w-80 shrink-0 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="rounded-lg border border-white/[0.06] bg-[var(--bg-card)] p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-2 w-full rounded-full" />
                        </div>
                    ))}
                </div>

                {/* Results panel */}
                <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-4 gap-3">
                        {Array.from({ length: 4 }, (_, i) => (
                            <div key={i} className="rounded-lg border border-white/[0.06] bg-[var(--bg-card)] p-4">
                                <Skeleton className="mb-1 h-6 w-12" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        ))}
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-[var(--bg-card)] overflow-hidden">
                        <Skeleton className="h-10 w-full" />
                        {Array.from({ length: 5 }, (_, i) => (
                            <div key={i} className="border-t border-white/[0.04] px-4 py-3">
                                <Skeleton className="h-8 w-full rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
