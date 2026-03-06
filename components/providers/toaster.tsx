// Copyright (c) Said Borna. All rights reserved.
"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Global toast notification provider — renders the Sonner toaster.
 * Position: bottom-right. Dark theme styling to match app design.
 */
export function Toaster() {
    return (
        <SonnerToaster
            position="bottom-right"
            toastOptions={{
                duration: 3500,
                style: {
                    background: "var(--bg-card)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                },
            }}
            theme="dark"
        />
    );
}
