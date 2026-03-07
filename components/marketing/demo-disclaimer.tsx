// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const DISCLAIMER_TEXT =
    "This is a product demo with simulated data. Features shown represent the intended product vision — backend integrations (AI content generation, LinkedIn automation, lead enrichment) are under active development.";

/**
 * Floating disclaimer banner — appears at the bottom of the landing page
 * and inside the app. Dismissable per session.
 */
export function DemoDisclaimer() {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-yellow-500/20 bg-yellow-950/90 px-4 py-3 backdrop-blur-lg">
            <div className="mx-auto flex max-w-5xl items-center gap-3">
                <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-400" />
                <p className="flex-1 text-xs leading-relaxed text-yellow-200/90 sm:text-sm">
                    {DISCLAIMER_TEXT}
                </p>
                <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    className="shrink-0 rounded-lg p-1 text-yellow-400/60 transition-colors hover:bg-yellow-400/10 hover:text-yellow-300"
                    aria-label="Dismiss disclaimer"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
