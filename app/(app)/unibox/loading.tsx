// Copyright (c) Said Borna. All rights reserved.
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Unibox loading skeleton — conversation list + message thread.
 */
export default function UniboxLoading() {
    return (
        <div className="flex h-[calc(100vh-120px)] gap-0 overflow-hidden rounded-xl border border-white/[0.06]">
            {/* Left panel — conversation list */}
            <div className="w-96 shrink-0 border-r border-white/[0.06] bg-[var(--bg-card)] p-4 space-y-3">
                <Skeleton className="h-10 w-full rounded-lg" />
                <div className="flex gap-2">
                    {Array.from({ length: 4 }, (_, i) => (
                        <Skeleton key={i} className="h-8 w-16 rounded-lg" />
                    ))}
                </div>
                <Skeleton className="h-9 w-full rounded-lg" />
                {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg p-3">
                        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                        <Skeleton className="h-3 w-10" />
                    </div>
                ))}
            </div>

            {/* Right panel — thread */}
            <div className="flex flex-1 flex-col bg-[var(--bg-primary)]">
                {/* Thread header */}
                <div className="flex items-center gap-3 border-b border-white/[0.06] p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-4 p-6">
                    <div className="flex justify-start">
                        <Skeleton className="h-16 w-64 rounded-2xl" />
                    </div>
                    <div className="flex justify-end">
                        <Skeleton className="h-12 w-48 rounded-2xl" />
                    </div>
                    <div className="flex justify-start">
                        <Skeleton className="h-20 w-72 rounded-2xl" />
                    </div>
                    <div className="flex justify-end">
                        <Skeleton className="h-16 w-56 rounded-2xl" />
                    </div>
                </div>

                {/* Input */}
                <div className="border-t border-white/[0.06] p-4">
                    <Skeleton className="h-20 w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}
