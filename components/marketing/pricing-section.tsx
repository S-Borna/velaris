// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AnimatedSection, AnimatedGroup, fadeInUpCard } from "./animations";

const YEARLY_DISCOUNT = 0.7; // 30% off

interface PricingTier {
    name: string;
    monthlyPrice: number;
    description: string;
    highlighted: boolean;
    features: string[];
}

const PRICING_TIERS: PricingTier[] = [
    {
        name: "Free",
        monthlyPrice: 0,
        description: "Get started with basic outreach",
        highlighted: false,
        features: [
            "1 LinkedIn Account",
            "100 DB Leads / month",
            "50 ICP Credits",
            "5 AI Posts / month",
            "1 Campaign",
            "Community support",
        ],
    },
    {
        name: "Solo",
        monthlyPrice: 49,
        description: "For individual power users",
        highlighted: false,
        features: [
            "3 LinkedIn Accounts",
            "2,000 DB Leads / month",
            "500 ICP Credits",
            "50 AI Posts / month",
            "10 Campaigns",
            "Priority email support",
            "CSV import & export",
        ],
    },
    {
        name: "Team",
        monthlyPrice: 149,
        description: "For growing sales teams",
        highlighted: true,
        features: [
            "10 LinkedIn Accounts",
            "10,000 DB Leads / month",
            "2,000 ICP Credits",
            "Unlimited AI Posts",
            "Unlimited Campaigns",
            "Priority support",
            "Team workspaces",
            "CRM integrations",
            "API access",
        ],
    },
    {
        name: "Agency",
        monthlyPrice: 349,
        description: "For agencies managing clients",
        highlighted: false,
        features: [
            "50 LinkedIn Accounts",
            "50,000 DB Leads / month",
            "10,000 ICP Credits",
            "Unlimited AI Posts",
            "Unlimited Campaigns",
            "Dedicated support",
            "White-label branding",
            "Custom onboarding",
            "Webhook & API",
            "Multi-workspace",
        ],
    },
];

/**
 * Pricing section — monthly/yearly toggle + 4 plan cards.
 * Team tier highlighted as recommended.
 */
export function PricingSection() {
    const [yearly, setYearly] = useState(false);

    const getPrice = (monthly: number): string => {
        if (monthly === 0) return "$0";
        const price = yearly ? Math.round(monthly * YEARLY_DISCOUNT) : monthly;
        return `$${price}`;
    };

    return (
        <section id="pricing" className="relative bg-[var(--bg-primary)] py-20 sm:py-28">
            {/* Background subtle glow */}
            <div
                className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-purple-600/[0.04] blur-[120px]"
                aria-hidden="true"
            />

            <AnimatedSection className="mx-auto max-w-3xl px-6 text-center">
                <p className="text-sm font-medium uppercase tracking-widest text-purple-400">
                    Pricing
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Pick the best plan for accelerating your organic growth
                </h2>
            </AnimatedSection>

            {/* Toggle */}
            <div className="mx-auto mt-10 flex justify-center">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.03] p-1.5">
                    <button
                        type="button"
                        onClick={() => setYearly(false)}
                        className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${!yearly
                                ? "bg-white/[0.1] text-white shadow-sm"
                                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        type="button"
                        onClick={() => setYearly(true)}
                        className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${yearly
                                ? "bg-purple-500/15 text-purple-300 shadow-sm"
                                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                            }`}
                    >
                        Yearly
                        <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-300">
                            -30%
                        </span>
                    </button>
                </div>
            </div>

            {/* Cards */}
            <AnimatedGroup className="mx-auto mt-12 grid max-w-6xl gap-5 px-6 sm:grid-cols-2 lg:grid-cols-4">
                {PRICING_TIERS.map((tier) => (
                    <motion.div
                        key={tier.name}
                        variants={fadeInUpCard}
                        className={`relative flex flex-col overflow-hidden rounded-xl border transition-all hover:-translate-y-1 ${tier.highlighted
                                ? "border-purple-500/40 bg-[var(--bg-card)] shadow-xl shadow-purple-500/10"
                                : "border-white/[0.08] bg-[var(--bg-card)]"
                            }`}
                    >
                        {/* Recommended badge */}
                        {tier.highlighted && (
                            <div className="bg-purple-500 px-4 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-white">
                                Most Popular
                            </div>
                        )}

                        {/* Glow for highlighted */}
                        {tier.highlighted && (
                            <div
                                className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-purple-500/15 blur-[60px]"
                                aria-hidden="true"
                            />
                        )}

                        <div className="flex flex-1 flex-col p-6">
                            {/* Tier name */}
                            <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">{tier.description}</p>

                            {/* Price */}
                            <div className="mt-5 flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-white">
                                    {getPrice(tier.monthlyPrice)}
                                </span>
                                {tier.monthlyPrice > 0 && (
                                    <span className="text-sm text-[var(--text-muted)]">
                                        / mo
                                    </span>
                                )}
                            </div>
                            {yearly && tier.monthlyPrice > 0 && (
                                <p className="mt-1 text-xs text-[var(--text-muted)] line-through">
                                    ${tier.monthlyPrice} / mo
                                </p>
                            )}

                            {/* CTA */}
                            <Link
                                href="/signup"
                                className={`mt-6 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${tier.highlighted
                                        ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20 hover:brightness-110"
                                        : "border border-white/[0.12] text-white hover:bg-white/[0.05]"
                                    }`}
                            >
                                Get Started
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>

                            {/* Features */}
                            <ul className="mt-6 flex-1 space-y-2.5">
                                {tier.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                ))}
            </AnimatedGroup>
        </section>
    );
}
