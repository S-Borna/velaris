// Copyright (c) Said Borna. All rights reserved.
"use client";

import {
    Zap,
    Search,
    MessageSquare,
    Target,
    ArrowUpRight,
} from "lucide-react";
import { AnimatedSection, AnimatedGroup, fadeInUp, fadeInUpCard } from "./animations";
import { motion } from "framer-motion";

interface Integration {
    name: string;
    color: string;
    initial: string;
    connected?: boolean;
}

const INTEGRATIONS: Integration[] = [
    { name: "HubSpot", color: "#FF7A59", initial: "H", connected: true },
    { name: "Salesforce", color: "#00A1E0", initial: "S", connected: true },
    { name: "Pipedrive", color: "#21B97A", initial: "P" },
    { name: "Slack", color: "#E01E5A", initial: "S", connected: true },
    { name: "Zapier", color: "#FF4A00", initial: "Z" },
    { name: "Monday.com", color: "#6161FF", initial: "M" },
    { name: "Copper", color: "#F1813F", initial: "C" },
    { name: "Browserbase", color: "#10B981", initial: "B" },
];

interface FeatureBadge {
    label: string;
    icon: React.ReactNode;
}

const FEATURE_BADGES: FeatureBadge[] = [
    { label: "Outbound", icon: <Zap className="h-3.5 w-3.5" /> },
    { label: "Lead Finder", icon: <Search className="h-3.5 w-3.5" /> },
    { label: "Inbound", icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { label: "ICP Scoring", icon: <Target className="h-3.5 w-3.5" /> },
];

/**
 * Integrations section — large centered icon with glow,
 * Apps card (left) + Features card (right).
 */
export function IntegrationsSection() {
    return (
        <section id="integrations" className="relative overflow-hidden bg-[var(--bg-primary)] py-20 sm:py-28">
            {/* Background glow */}
            <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/[0.06] blur-[120px]"
                aria-hidden="true"
            />

            <AnimatedSection className="mx-auto max-w-3xl px-6 text-center">
                <p className="text-sm font-medium uppercase tracking-widest text-purple-400">
                    Integrations
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Connects with your entire stack
                </h2>
                <p className="mt-4 text-base text-[var(--text-secondary)]">
                    Push leads to your CRM, trigger Slack notifications, sync with your pipeline — all automatically.
                </p>
            </AnimatedSection>

            {/* Center logo + glow */}
            <div className="relative mx-auto mt-12 flex justify-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: false, amount: 0.5 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-600 shadow-2xl shadow-purple-500/30"
                >
                    <span className="text-3xl font-bold text-white">O</span>
                    {/* Glow ring */}
                    <div className="absolute -inset-4 rounded-3xl border border-purple-500/20" />
                    <div className="absolute -inset-8 rounded-[2rem] border border-purple-500/10" />
                    <div className="absolute -inset-12 rounded-[2.5rem] border border-purple-500/5" />
                </motion.div>
            </div>

            {/* Cards */}
            <AnimatedGroup className="mx-auto mt-12 grid max-w-5xl gap-6 px-6 md:grid-cols-2">
                {/* Apps card */}
                <motion.div variants={fadeInUpCard} className="overflow-hidden rounded-xl border border-white/[0.08] bg-[var(--bg-card)]">
                    <div className="border-b border-white/[0.06] px-5 py-3">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">Apps</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 p-5">
                        {INTEGRATIONS.map((int) => (
                            <div
                                key={int.name}
                                className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
                            >
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                                    style={{ backgroundColor: int.color }}
                                >
                                    {int.initial}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium text-white">{int.name}</p>
                                    {int.connected && (
                                        <p className="text-[10px] text-green-400">Connected</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Features card */}
                <motion.div variants={fadeInUpCard} className="overflow-hidden rounded-xl border border-white/[0.08] bg-[var(--bg-card)]">
                    <div className="border-b border-white/[0.06] px-5 py-3">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">Features</span>
                    </div>
                    <div className="flex flex-col gap-3 p-5">
                        {FEATURE_BADGES.map((feat) => (
                            <div
                                key={feat.label}
                                className="group flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500/15 text-purple-300">
                                        {feat.icon}
                                    </div>
                                    <span className="text-sm font-medium text-white">{feat.label}</span>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-[var(--text-muted)] transition-colors group-hover:text-purple-400" />
                            </div>
                        ))}
                    </div>
                </motion.div>
            </AnimatedGroup>
        </section>
    );
}
