// Copyright (c) Said Borna. All rights reserved.

import { Playfair_Display } from "next/font/google";

const APP_NAME = "OutreachPilot";

const playfairDisplay = Playfair_Display({
    subsets: ["latin"],
    weight: ["600", "700"],
});

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0B0713] via-[#110D1D] to-[#0B0713] px-4">
            <div
                className="pointer-events-none absolute -top-44 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-purple-600/10 blur-3xl"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -bottom-56 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_70%)]"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)",
                    backgroundSize: "3px 3px",
                }}
                aria-hidden="true"
            />

            <div className="relative z-10 w-full max-w-md">
                <div className="mb-8 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-900/40">
                            <div className="absolute inset-1 rounded-full border border-white/20" />
                            <div className="h-2.5 w-2.5 rounded-full bg-white/80" />
                        </div>
                        <span
                            className={`${playfairDisplay.className} text-[2rem] tracking-tight text-white`}
                        >
                            {APP_NAME}
                        </span>
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
}
