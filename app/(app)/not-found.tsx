// Copyright (c) Said Borna. All rights reserved.
import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";

/**
 * App-level 404 page — shown when no route matches within the (app) group.
 */
export default function AppNotFound() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[var(--bg-card)] p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/10">
                    <FileQuestion className="h-7 w-7 text-purple-400" />
                </div>
                <h2 className="mb-2 text-lg font-semibold text-white">
                    Page not found
                </h2>
                <p className="mb-6 text-sm text-[var(--text-secondary)]">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-lg bg-purple-500/15 px-5 py-2.5 text-sm font-medium text-purple-300 transition-all hover:bg-purple-500/25 hover:-translate-y-[1px] focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0713]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
