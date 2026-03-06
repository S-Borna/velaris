// Copyright (c) Said Borna. All rights reserved.
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Inbound Automations loading skeleton — automation cards.
 */
export default function InboundAutomationsLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-10 w-40 rounded-lg" />
            </div>

            {/* Automation cards */}
            <div className="space-y-4">
                {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="rounded-xl border border-white/[0.06] bg-[var(--bg-card)] p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {Array.from({ length: 3 }, (_, j) => (
                                <div key={j} className="rounded-lg bg-white/[0.02] p-3 space-y-1">
                                    <Skeleton className="h-6 w-12" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
