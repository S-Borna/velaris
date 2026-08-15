// Copyright (c) Said Borna. All rights reserved.
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatedSection, fadeInUp } from "./animations";

/**
 * Bottom CTA section — "Try Velaris for free!" with floating app screenshots.
 */
export function CtaSection() {
    return (
        <section className="relative overflow-hidden bg-[var(--bg-primary)] py-20 sm:py-28">
            {/* Background glow */}
            <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/[0.06] blur-[120px]"
                aria-hidden="true"
            />

            <AnimatedSection className="relative z-10 mx-auto max-w-3xl px-6 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                    Try Velaris for free!
                </h2>
                <p className="mt-4 text-base text-[var(--text-secondary)]">
                    Start automating your LinkedIn outreach with AI-powered
                    sequences, content, and lead management. No credit card required.
                </p>

                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
                    <Link
                        href="/signup"
                        className="group inline-flex items-center gap-2 rounded-full bg-purple-500 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:brightness-110"
                    >
                        Start for Free
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </div>

                <p className="mt-4 text-xs text-[var(--text-muted)]">
                    Free forever plan available · No credit card required · Setup in 2 minutes
                </p>
            </AnimatedSection>

            {/* Floating app screenshots mockup */}
            <AnimatedSection className="relative z-10 mx-auto mt-16 max-w-5xl px-6">
                <div className="flex justify-center gap-6">
                    {/* Dashboard screenshot */}
                    <div
                        className="w-1/2 max-w-md overflow-hidden rounded-xl border border-white/[0.08] bg-[var(--bg-card)] shadow-2xl shadow-black/40"
                        style={{
                            transform: "perspective(1200px) rotateY(5deg) rotateX(2deg)",
                        }}
                    >
                        <DashboardMiniMockup />
                    </div>

                    {/* Lead finder screenshot */}
                    <div
                        className="hidden w-1/2 max-w-md overflow-hidden rounded-xl border border-white/[0.08] bg-[var(--bg-card)] shadow-2xl shadow-black/40 md:block"
                        style={{
                            transform: "perspective(1200px) rotateY(-5deg) rotateX(2deg)",
                        }}
                    >
                        <LeadFinderMiniMockup />
                    </div>
                </div>

                {/* Fade at bottom */}
                <div className="pointer-events-none absolute -bottom-1 left-0 right-0 h-20 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" aria-hidden="true" />
            </AnimatedSection>
        </section>
    );
}

/* ---------- Mini mockups ---------- */

const MINI_KPIS = [
    { label: "Sent", value: "2,683", color: "bg-blue-500" },
    { label: "Accepted", value: "1,847", color: "bg-purple-500" },
    { label: "Replies", value: "527", color: "bg-orange-500" },
] as const;

function DashboardMiniMockup() {
    return (
        <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Dashboard</span>
                <span className="rounded-md bg-purple-500/15 px-2 py-1 text-[10px] text-purple-300">This month</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {MINI_KPIS.map((kpi) => (
                    <div key={kpi.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                        <div className={`mb-1.5 h-0.5 w-6 rounded-full ${kpi.color}`} />
                        <p className="text-sm font-bold text-white">{kpi.value}</p>
                        <p className="text-[9px] text-[var(--text-muted)]">{kpi.label}</p>
                    </div>
                ))}
            </div>
            {/* Mini chart */}
            <div className="mt-3 flex h-16 items-end gap-1">
                {Array.from({ length: 16 }, (_, i) => {
                    const height = 25 + Math.sin(i * 0.6) * 30 + Math.cos(i * 0.3) * 15;
                    return (
                        <div
                            key={i}
                            className="flex-1 rounded-t bg-gradient-to-t from-purple-500/30 to-purple-400/50"
                            style={{ height: `${height}%` }}
                        />
                    );
                })}
            </div>
        </div>
    );
}

const MINI_LEADS = [
    { name: "Sarah B.", title: "CEO @ TechCorp" },
    { name: "Marcus L.", title: "Founder @ SaaSify" },
    { name: "Anna J.", title: "VP Sales @ GrowthCo" },
] as const;

function LeadFinderMiniMockup() {
    return (
        <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Lead Finder</span>
                <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] text-purple-300">2,847 results</span>
            </div>
            <div className="mb-3 rounded-md border border-white/[0.06] bg-[var(--bg-input)] px-2.5 py-1.5 text-[10px] text-[var(--text-muted)]">
                Search leads...
            </div>
            <div className="space-y-1.5">
                {MINI_LEADS.map((lead) => (
                    <div key={lead.name} className="flex items-center gap-2 rounded-md border border-white/[0.04] px-2.5 py-2">
                        <div className="h-6 w-6 rounded-full bg-purple-500/70" />
                        <div>
                            <p className="text-[10px] font-medium text-white">{lead.name}</p>
                            <p className="text-[9px] text-[var(--text-muted)]">{lead.title}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
