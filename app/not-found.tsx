// Copyright (c) Said Borna. All rights reserved.
import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";

/**
 * Global 404 page — shown when no route matches anywhere in the app.
 */
export default function GlobalNotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-6">
            <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[var(--bg-card)] p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/10">
                    <FileQuestion className="h-7 w-7 text-purple-400" />
                </div>
                <h2 className="mb-1 text-4xl font-bold text-white">404</h2>
                <h3 className="mb-2 text-lg font-semibold text-white">
                    Page not found
                </h3>
                <p className="mb-6 text-sm text-[var(--text-secondary)]">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-lg bg-purple-500/15 px-5 py-2.5 text-sm font-medium text-purple-300 transition-all hover:bg-purple-500/25 hover:-translate-y-[1px] focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0713]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Go home
                </Link>
            </div>
        </div>
    );
}
