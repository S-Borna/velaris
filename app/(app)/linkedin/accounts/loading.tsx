// Copyright (c) Said Borna. All rights reserved.
import { Skeleton } from "@/components/ui/skeleton";

/**
 * LinkedIn Accounts loading skeleton.
 */
export default function LinkedInAccountsLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-44" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-48 rounded-lg" />
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[var(--bg-card)] overflow-hidden">
                <Skeleton className="h-11 w-full" />
                {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="border-t border-white/[0.04] px-4 py-3">
                        <Skeleton className="h-12 w-full rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
