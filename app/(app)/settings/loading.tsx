// Copyright (c) Said Borna. All rights reserved.
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Settings loading skeleton — sidebar tabs + form fields.
 */
export default function SettingsLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-28" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>

            <div className="flex gap-6">
                {/* Tab sidebar */}
                <div className="w-52 shrink-0 space-y-1">
                    {Array.from({ length: 5 }, (_, i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 rounded-xl border border-white/[0.06] bg-[var(--bg-card)] p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {Array.from({ length: 4 }, (_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
