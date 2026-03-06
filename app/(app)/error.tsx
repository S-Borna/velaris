// Copyright (c) Said Borna. All rights reserved.
"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
    /** Error object from React error boundary. */
    error: Error & { digest?: string };
    /** Retry function to re-render the boundary. */
    reset: () => void;
}

/**
 * App-level error boundary — catches route-level React errors.
 * Renders a dark-themed error card with retry button.
 */
export default function AppError({ error, reset }: ErrorBoundaryProps) {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
            <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[var(--bg-card)] p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                    <AlertTriangle className="h-7 w-7 text-red-400" />
                </div>
                <h2 className="mb-2 text-lg font-semibold text-white">
                    Something went wrong
                </h2>
                <p className="mb-6 text-sm text-[var(--text-secondary)]">
                    {error.message || "An unexpected error occurred. Please try again."}
                </p>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-2 rounded-lg bg-purple-500/15 px-5 py-2.5 text-sm font-medium text-purple-300 transition-all hover:bg-purple-500/25 hover:-translate-y-[1px] focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0713]"
                >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                </button>
            </div>
        </div>
    );
}
