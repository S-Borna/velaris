// Copyright (c) Said Borna. All rights reserved.
"use client";

import { AnimatedSection, fadeInUp } from "./animations";

interface LogoItem {
    name: string;
    badge?: "Review" | "Case study";
}

const LOGOS_ROW_1: LogoItem[] = [
    { name: "TechFlow", badge: "Review" },
    { name: "ScaleUp Labs" },
    { name: "GrowthHive" },
    { name: "NordLead", badge: "Case study" },
    { name: "DataSync AI" },
    { name: "Verma Tech", badge: "Review" },
    { name: "Lemon Squeezy" },
    { name: "BecGrowth", badge: "Case study" },
];

const LOGOS_ROW_2: LogoItem[] = [
    { name: "SalesPipe" },
    { name: "LeadEngine", badge: "Review" },
    { name: "OutboundPro" },
    { name: "ConnectIQ" },
    { name: "PipelineAI", badge: "Case study" },
    { name: "RevenueStack" },
];

const SCROLL_DURATION_ROW_1 = "40s";
const SCROLL_DURATION_ROW_2 = "35s";

/**
 * Trust logos section — continuous horizontal scroll marquee.
 * Two rows with company names + optional badges.
 * Pauses on hover per CLAUDE.md animation spec.
 */
export function TrustLogos() {
    return (
        <section className="relative overflow-hidden border-y border-white/[0.04] bg-[var(--bg-primary)] py-16 sm:py-20">
            <AnimatedSection className="mb-10 text-center">
                <p className="text-sm font-medium uppercase tracking-widest text-[var(--text-muted)]">
                    Trusted by many heavy lifters
                </p>
            </AnimatedSection>

            {/* Row 1 — scrolls left */}
            <div className="group relative mb-6">
                <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[var(--bg-primary)] to-transparent" aria-hidden="true" />
                <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[var(--bg-primary)] to-transparent" aria-hidden="true" />

                <div
                    className="flex w-max animate-marquee gap-8 group-hover:[animation-play-state:paused]"
                    style={{ animationDuration: SCROLL_DURATION_ROW_1 }}
                >
                    {/* Duplicate for seamless loop */}
                    {[...LOGOS_ROW_1, ...LOGOS_ROW_1].map((logo, i) => (
                        <LogoCard key={`${logo.name}-${i}`} item={logo} />
                    ))}
                </div>
            </div>

            {/* Row 2 — scrolls right (reverse) */}
            <div className="group relative">
                <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[var(--bg-primary)] to-transparent" aria-hidden="true" />
                <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[var(--bg-primary)] to-transparent" aria-hidden="true" />

                <div
                    className="flex w-max animate-marquee-reverse gap-8 group-hover:[animation-play-state:paused]"
                    style={{ animationDuration: SCROLL_DURATION_ROW_2 }}
                >
                    {[...LOGOS_ROW_2, ...LOGOS_ROW_2].map((logo, i) => (
                        <LogoCard key={`${logo.name}-${i}`} item={logo} />
                    ))}
                </div>
            </div>
        </section>
    );
}

interface LogoCardProps {
    item: LogoItem;
}

/**
 * Individual logo card — company initial + name + optional badge.
 */
function LogoCard({ item }: LogoCardProps) {
    /** Generate a deterministic color from the company name. */
    const hue = item.name
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;

    return (
        <div className="flex shrink-0 items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-5 py-3 transition-colors hover:border-white/[0.12] hover:bg-white/[0.04]">
            {/* Logo icon — first letter in a colored circle */}
            <div
                className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-white"
                style={{
                    background: `linear-gradient(135deg, hsl(${hue}, 60%, 50%), hsl(${hue + 30}, 60%, 40%))`,
                }}
            >
                {item.name.charAt(0)}
            </div>

            <span className="text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
                {item.name}
            </span>

            {item.badge && (
                <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${item.badge === "Case study"
                            ? "bg-purple-500/15 text-purple-300"
                            : "bg-green-500/15 text-green-300"
                        }`}
                >
                    {item.badge}
                </span>
            )}
        </div>
    );
}
