// Copyright (c) Said Borna. All rights reserved.
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Content Assistant loading skeleton — form + preview.
 */
export default function ContentAssistantLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-44" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-28 rounded-lg" />
                    <Skeleton className="h-9 w-24 rounded-lg" />
                    <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
            </div>

            {/* Split panel */}
            <div className="flex gap-6">
                {/* Form panel */}
                <div className="w-[420px] shrink-0 space-y-4 rounded-xl border border-white/[0.06] bg-[var(--bg-card)] p-6">
                    {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                    ))}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <div className="grid grid-cols-3 gap-2">
                            {Array.from({ length: 6 }, (_, i) => (
                                <Skeleton key={i} className="h-14 rounded-lg" />
                            ))}
                        </div>
                    </div>
                    <Skeleton className="h-11 w-full rounded-lg" />
                </div>

                {/* Preview panel */}
                <div className="flex-1 space-y-4">
                    <div className="rounded-xl border border-white/[0.06] bg-[var(--bg-card)] p-6 space-y-4">
                        <div className="flex gap-3 items-center">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-32 w-full rounded-lg" />
                        <div className="flex gap-4">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-[var(--bg-card)] p-6 space-y-3">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-3 w-full rounded-full" />
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
