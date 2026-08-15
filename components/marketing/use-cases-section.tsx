// Copyright (c) Said Borna. All rights reserved.
"use client";

import { ArrowRight, TrendingUp, Users, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedSection, AnimatedGroup, fadeInUpCard } from "./animations";

interface CaseStudy {
    title: string;
    metric: string;
    metricLabel: string;
    description: string;
    icon: React.ReactNode;
    accentColor: string;
}

const CASE_STUDIES: CaseStudy[] = [
    {
        title: "Scale outbound with multi-sender campaigns",
        metric: "5x",
        metricLabel: "more pipeline coverage",
        description: "Run parallel outreach across multiple LinkedIn accounts with smart daily limits and automated sequence execution.",
        icon: <TrendingUp className="h-5 w-5" />,
        accentColor: "from-green-500 to-emerald-400",
    },
    {
        title: "Build authority with AI-generated content",
        metric: "10x",
        metricLabel: "faster content creation",
        description: "Generate on-brand LinkedIn posts, carousels, and lead magnets with AI — then schedule across all your profiles.",
        icon: <Eye className="h-5 w-5" />,
        accentColor: "from-amber-500 to-orange-400",
    },
    {
        title: "Convert inbound engagement automatically",
        metric: "24/7",
        metricLabel: "automated workflows",
        description: "Monitor posts for trigger keywords, auto-reply to comments, and DM engaged prospects — all on autopilot.",
        icon: <Users className="h-5 w-5" />,
        accentColor: "from-rose-500 to-red-400",
    },
];

/**
 * Use cases section — case study cards with key metrics.
 */
export function UseCasesSection() {
    return (
        <section id="use-cases" className="relative bg-[var(--bg-primary)] py-20 sm:py-28">
            <AnimatedSection className="mx-auto max-w-3xl px-6 text-center">
                <p className="text-sm font-medium uppercase tracking-widest text-purple-400">
                    Use Cases
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Outbound + inbound + content — all in one platform
                </h2>
                <p className="mt-4 text-base text-[var(--text-secondary)]">
                    Everything you need to generate pipeline, build authority, and close deals on LinkedIn.
                </p>
            </AnimatedSection>

            <AnimatedGroup className="mx-auto mt-14 grid max-w-6xl gap-6 px-6 md:grid-cols-3">
                {CASE_STUDIES.map((study) => (
                    <motion.div
                        key={study.title}
                        variants={fadeInUpCard}
                        className="group flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[var(--bg-card)] transition-all hover:border-white/[0.15] hover:-translate-y-1"
                    >
                        {/* Gradient top bar */}
                        <div className={`h-1 w-full bg-gradient-to-r ${study.accentColor}`} />

                        <div className="flex flex-1 flex-col p-6">
                            {/* Icon */}
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${study.accentColor} text-white shadow-lg`}>
                                {study.icon}
                            </div>

                            {/* Metric */}
                            <div className="mt-5">
                                <span className="text-3xl font-bold text-white">{study.metric}</span>
                                <span className="ml-2 text-sm text-[var(--text-muted)]">{study.metricLabel}</span>
                            </div>

                            {/* Title + description */}
                            <h3 className="mt-3 text-base font-semibold text-white">
                                {study.title}
                            </h3>
                            <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                                {study.description}
                            </p>

                            {/* CTA */}
                            <a
                                href="#"
                                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-purple-400 transition-colors group-hover:text-purple-300"
                            >
                                Read case study
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                            </a>
                        </div>
                    </motion.div>
                ))}
            </AnimatedGroup>

            {/* Explore CTA */}
            <AnimatedSection className="mt-12 text-center">
                <a
                    href="#"
                    className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] px-6 py-3 text-sm font-medium text-white transition-all hover:border-white/25 hover:bg-white/[0.04]"
                >
                    Explore Cases
                    <ArrowRight className="h-4 w-4" />
                </a>
            </AnimatedSection>
        </section>
    );
}
