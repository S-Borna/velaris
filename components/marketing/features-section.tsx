// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Search,
    Filter,
    Users,
    Target,
    Zap,
    MessageSquare,
    Inbox,
    ArrowRight,
    CheckCircle2,
    Clock,
    UserPlus,
    Eye,
    ThumbsUp,
    Send,
} from "lucide-react";
import {
    AnimatedSection,
    AnimatedGroup,
    fadeInUp,
    fadeInUpCard,
    slideInLeft,
    slideInRight,
} from "./animations";

/* ---------- Constants ---------- */

const SECTION_HEADER = "Have complete control over your LinkedIn game all in one platform.";

interface FeatureTab {
    id: string;
    label: string;
    icon: React.ReactNode;
}

const FEATURE_TABS: FeatureTab[] = [
    { id: "leads", label: "Leads", icon: <Search className="h-4 w-4" /> },
    { id: "qualify", label: "Qualify", icon: <Target className="h-4 w-4" /> },
    { id: "scale", label: "Scale", icon: <Users className="h-4 w-4" /> },
    { id: "contact", label: "Contact", icon: <Zap className="h-4 w-4" /> },
    { id: "unibox", label: "Unibox", icon: <Inbox className="h-4 w-4" /> },
];

interface Testimonial {
    metric: string;
    company: string;
    description: string;
}

const TESTIMONIALS: Record<string, Testimonial> = {
    leads: {
        metric: "28",
        company: "SeaOfLeads",
        description: "Qualified opportunities from our lead finder",
    },
    qualify: {
        metric: "$50K",
        company: "A-Leads",
        description: "Contracts closed through ICP qualification",
    },
    scale: {
        metric: "$70K",
        company: "BecGrowth",
        description: "Generated in 40 days",
    },
    contact: {
        metric: "30%",
        company: "Meed",
        description: "Cold reply rate on LinkedIn on auto-pilot",
    },
    unibox: {
        metric: "4.28",
        company: "OutreachPilot",
        description: "Calls booked per day on autopilot",
    },
};

/**
 * Features section with sticky sidebar navigation.
 * Each subsection scrolls into view and highlights the corresponding tab.
 */
export function FeaturesSection() {
    const [activeTab, setActiveTab] = useState("leads");
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute("data-feature-id");
                if (id) setActiveTab(id);
            }
        }
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(handleIntersection, {
            rootMargin: "-40% 0px -40% 0px",
            threshold: 0,
        });

        const currentRefs = sectionRefs.current;
        for (const ref of Object.values(currentRefs)) {
            if (ref) observer.observe(ref);
        }

        return () => observer.disconnect();
    }, [handleIntersection]);

    const scrollToSection = (id: string) => {
        const el = sectionRefs.current[id];
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    return (
        <section id="features" className="relative bg-[var(--bg-primary)] py-20 sm:py-28">
            {/* Section header */}
            <AnimatedSection className="mx-auto max-w-4xl px-6 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                    {SECTION_HEADER}
                </h2>
            </AnimatedSection>

            {/* Content with sticky sidebar */}
            <div className="mx-auto mt-16 max-w-7xl px-6">
                <div className="flex gap-12 lg:gap-16">
                    {/* Sticky sidebar nav (desktop only) */}
                    <div className="hidden lg:block">
                        <div className="sticky top-32 w-48">
                            <nav className="flex flex-col gap-1">
                                {FEATURE_TABS.map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => scrollToSection(tab.id)}
                                        className={`group flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all duration-300 ${
                                            activeTab === tab.id
                                                ? "bg-purple-500/10 text-purple-400 shadow-sm shadow-purple-500/5"
                                                : "text-[var(--text-muted)] hover:bg-white/[0.03] hover:text-[var(--text-secondary)]"
                                        }`}
                                        aria-current={activeTab === tab.id ? "true" : undefined}
                                    >
                                        <span
                                            className={`transition-colors ${
                                                activeTab === tab.id
                                                    ? "text-purple-400"
                                                    : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                                            }`}
                                        >
                                            {tab.icon}
                                        </span>
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Mobile tab bar */}
                    <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 lg:hidden">
                        <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-[var(--bg-primary)]/90 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl">
                            {FEATURE_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => scrollToSection(tab.id)}
                                    className={`rounded-full px-3 py-2 text-xs font-medium transition-all ${
                                        activeTab === tab.id
                                            ? "bg-purple-500/20 text-purple-300"
                                            : "text-[var(--text-muted)]"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Feature subsections */}
                    <div className="flex-1 space-y-32">
                        <div
                            ref={(el) => { sectionRefs.current.leads = el; }}
                            data-feature-id="leads"
                        >
                            <LeadsFeature />
                        </div>

                        <div
                            ref={(el) => { sectionRefs.current.qualify = el; }}
                            data-feature-id="qualify"
                        >
                            <QualifyFeature />
                        </div>

                        <div
                            ref={(el) => { sectionRefs.current.scale = el; }}
                            data-feature-id="scale"
                        >
                            <ScaleFeature />
                        </div>

                        <div
                            ref={(el) => { sectionRefs.current.contact = el; }}
                            data-feature-id="contact"
                        >
                            <ContactFeature />
                        </div>

                        <div
                            ref={(el) => { sectionRefs.current.unibox = el; }}
                            data-feature-id="unibox"
                        >
                            <UniboxFeature />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ---------- Feature Subsection Components ---------- */

interface FeatureBlockProps {
    icon: React.ReactNode;
    tag: string;
    title: string;
    description: string;
    testimonialKey: string;
    children: React.ReactNode;
    /** Mockup slides in from right by default; set to "left" to reverse. */
    mockupSide?: "left" | "right";
}

/**
 * Reusable feature subsection layout: text left + mockup right (or reversed).
 */
function FeatureBlock({
    icon,
    tag,
    title,
    description,
    testimonialKey,
    children,
    mockupSide = "right",
}: FeatureBlockProps) {
    const testimonial = TESTIMONIALS[testimonialKey];
    const textVariants = mockupSide === "right" ? slideInLeft : slideInRight;
    const mockupVariants = mockupSide === "right" ? slideInRight : slideInLeft;

    return (
        <div className={`flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16 ${
            mockupSide === "left" ? "lg:flex-row-reverse" : ""
        }`}>
            {/* Text side */}
            <AnimatedSection className="flex-1" variants={textVariants}>
                <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
                    {icon}
                    {tag}
                </div>
                <h3 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
                    {title}
                </h3>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                    {description}
                </p>

                <a
                    href="/signup"
                    className="group mt-6 inline-flex items-center gap-2 text-sm font-medium text-purple-400 transition-colors hover:text-purple-300"
                >
                    Learn more
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </a>

                {/* Testimonial badge */}
                {testimonial && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="mt-6 inline-flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
                    >
                        <span className="text-xl font-bold text-white">
                            {testimonial.metric}
                        </span>
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)]">
                                {testimonial.company}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)]">
                                {testimonial.description}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatedSection>

            {/* Mockup side */}
            <AnimatedSection className="flex-1" variants={mockupVariants}>
                <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[var(--bg-card)] shadow-2xl shadow-black/30">
                    {children}
                </div>
            </AnimatedSection>
        </div>
    );
}

/* ---------- Leads Feature ---------- */

const MOCK_LEADS = [
    { name: "Sarah Bloomberg", title: "CEO at TechCorp", location: "Stockholm, SE", company: "TechCorp" },
    { name: "Marcus Lindgren", title: "Co-founder at SaaSify", location: "London, UK", company: "SaaSify" },
    { name: "Anna Johansson", title: "VP Sales at GrowthCo", location: "Berlin, DE", company: "GrowthCo" },
    { name: "Daniel Eriksson", title: "CTO at DataPipe", location: "Oslo, NO", company: "DataPipe" },
] as const;

const LEAD_FILTERS = [
    "Job Title",
    "Seniority",
    "Location",
    "Company Size",
    "Industry",
] as const;

function LeadsFeature() {
    return (
        <FeatureBlock
            icon={<Search className="h-3.5 w-3.5" />}
            tag="Lead Finder"
            title="Find and enrich leads"
            description="Access 300M+ verified contacts. Search by job title, company, location, seniority, and 80+ advanced filters. Import from LinkedIn, Sales Navigator, CSV, or our built-in database. Every lead auto-enriched with email, phone, and company data."
            testimonialKey="leads"
        >
            <div className="p-4 sm:p-5">
                {/* Filter chips */}
                <div className="mb-4 flex flex-wrap gap-2">
                    {LEAD_FILTERS.map((f) => (
                        <span
                            key={f}
                            className="rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[10px] font-medium text-[var(--text-muted)] sm:text-xs"
                        >
                            <Filter className="mr-1 inline h-3 w-3" />
                            {f}
                        </span>
                    ))}
                </div>

                {/* Search bar */}
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[var(--bg-input)] px-3 py-2">
                    <Search className="h-4 w-4 text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-muted)]">
                        Search leads by name, company, or title...
                    </span>
                </div>

                {/* Results count */}
                <div className="mb-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>Showing 4 of 2,847 leads</span>
                    <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[10px] font-medium text-purple-300">
                        300M+ Verified
                    </span>
                </div>

                {/* Lead rows */}
                <div className="space-y-1">
                    {MOCK_LEADS.map((lead) => (
                        <div
                            key={lead.name}
                            className="flex items-center justify-between rounded-lg border border-white/[0.04] px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-400/60 to-blue-500/60 text-[10px] font-bold text-white">
                                    {lead.name.split(" ").map((n) => n[0]).join("")}
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-white sm:text-sm">
                                        {lead.name}
                                    </p>
                                    <p className="text-[10px] text-[var(--text-muted)] sm:text-xs">
                                        {lead.title}
                                    </p>
                                </div>
                            </div>
                            <span className="hidden text-xs text-[var(--text-muted)] sm:block">
                                {lead.location}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </FeatureBlock>
    );
}

/* ---------- Qualify Feature ---------- */

const ICP_TEST_LEADS = [
    { name: "Erik Svensson", score: 95, level: "High" as const },
    { name: "Laura Chen", score: 82, level: "High" as const },
    { name: "John Miller", score: 45, level: "Low" as const },
] as const;

function QualifyFeature() {
    return (
        <FeatureBlock
            icon={<Target className="h-3.5 w-3.5" />}
            tag="ICP Scoring"
            title="Qualify for ICP-fit"
            description="Describe your ideal customer in plain language. Our AI researches each lead and scores them 0-100 based on firmographics, role, company data, and your specific criteria. Filter out low-quality leads before they enter your sequence."
            testimonialKey="qualify"
            mockupSide="left"
        >
            <div className="p-4 sm:p-5">
                {/* ICP description */}
                <div className="mb-4">
                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                        Describe your ideal customer profile
                    </label>
                    <div className="rounded-lg border border-white/[0.08] bg-[var(--bg-input)] p-3 text-xs text-[var(--text-secondary)]">
                        Europe-based SaaS founder/CEO with 2-15 employees
                    </div>
                </div>

                {/* Cutoff slider */}
                <div className="mb-5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-secondary)]">Min. match score</span>
                        <span className="font-bold text-purple-400">70</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-purple-500 to-purple-400" />
                    </div>
                </div>

                {/* Test results */}
                <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                        Test Lead Scores
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                        3/5 passed
                    </span>
                </div>

                <div className="space-y-2">
                    {ICP_TEST_LEADS.map((lead) => (
                        <div
                            key={lead.name}
                            className="flex items-center justify-between rounded-lg border border-white/[0.04] px-3 py-2.5"
                        >
                            <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-400/60 to-blue-500/60 text-[10px] font-bold text-white">
                                    {lead.name.split(" ").map((n) => n[0]).join("")}
                                </div>
                                <span className="text-xs text-white">{lead.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${
                                    lead.score >= 70 ? "text-green-400" : "text-red-400"
                                }`}>
                                    {lead.score}
                                </span>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                    lead.level === "High"
                                        ? "bg-green-500/15 text-green-300"
                                        : "bg-red-500/15 text-red-300"
                                }`}>
                                    {lead.level}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Run badge */}
                <div className="mt-4 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                    <div className="flex -space-x-1.5">
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="h-5 w-5 rounded-full border-2 border-[var(--bg-card)] bg-gradient-to-br from-purple-400 to-purple-600"
                            />
                        ))}
                    </div>
                    Run 50 times per day
                </div>
            </div>
        </FeatureBlock>
    );
}

/* ---------- Scale Feature ---------- */

const MOCK_SENDERS = [
    { name: "[redacted]", status: "active" as const },
    { name: "Sarah Karlsson", status: "active" as const },
    { name: "Marcus Lindgren", status: "active" as const },
    { name: "[redacted]", status: "active" as const },
    { name: "Alex Carter", status: "paused" as const },
] as const;

function ScaleFeature() {
    return (
        <FeatureBlock
            icon={<Users className="h-3.5 w-3.5" />}
            tag="Multi-Account"
            title="Scale outreach with unlimited LinkedIn senders"
            description="Connect as many LinkedIn accounts as you need. Each runs on its own schedule with safe daily limits. Rotate senders across campaigns to maximize reach without risking bans. Real-time health monitoring for every account."
            testimonialKey="scale"
        >
            <div className="p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                        Active Accounts
                    </span>
                    <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 text-[10px] font-medium text-green-300">
                        4 / 5 Active
                    </span>
                </div>

                <div className="space-y-2">
                    {MOCK_SENDERS.map((sender) => (
                        <div
                            key={sender.name}
                            className="flex items-center justify-between rounded-lg border border-white/[0.04] px-3 py-2.5"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-400/60 to-blue-500/60 text-[10px] font-bold text-white">
                                        {sender.name.split(" ").map((n) => n[0]).join("")}
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg-card)] ${
                                        sender.status === "active" ? "bg-green-400" : "bg-yellow-400"
                                    }`} />
                                </div>
                                <div>
                                    <span className="text-xs font-medium text-white">
                                        {sender.name}
                                    </span>
                                    <p className="text-[10px] text-[var(--text-muted)]">
                                        {sender.status === "active" ? "Connected" : "Paused"}
                                    </p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-medium ${
                                sender.status === "active" ? "text-green-400" : "text-yellow-400"
                            }`}>
                                {sender.status === "active" ? "Active" : "Paused"}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Quick stats */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                        <p className="text-lg font-bold text-white">251</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Opportunities</p>
                    </div>
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                        <p className="text-lg font-bold text-green-400">+14%</p>
                        <p className="text-[10px] text-[var(--text-muted)]">This month</p>
                    </div>
                </div>
            </div>
        </FeatureBlock>
    );
}

/* ---------- Contact Feature (Sequence Flowchart) ---------- */

interface FlowNode {
    id: string;
    type: "start" | "action" | "condition" | "wait" | "end";
    label: string;
    icon?: React.ReactNode;
}

const FLOW_NODES: FlowNode[] = [
    { id: "start", type: "start", label: "Campaign Started" },
    { id: "icp", type: "condition", label: "ICP Score ≥ 70" },
    { id: "connect", type: "action", label: "Send Connection", icon: <UserPlus className="h-3 w-3" /> },
    { id: "wait1", type: "wait", label: "Wait 1 day" },
    { id: "view", type: "action", label: "View Profile", icon: <Eye className="h-3 w-3" /> },
    { id: "wait2", type: "wait", label: "Wait 3 days" },
    { id: "message", type: "action", label: "Send Message", icon: <Send className="h-3 w-3" /> },
    { id: "wait3", type: "wait", label: "Wait 1 day" },
    { id: "like", type: "action", label: "Like Post", icon: <ThumbsUp className="h-3 w-3" /> },
] as const;

function ContactFeature() {
    return (
        <FeatureBlock
            icon={<Zap className="h-3.5 w-3.5" />}
            tag="Sequences"
            title="Automate smart LinkedIn outreach campaigns"
            description="Build visual sequences with drag-and-drop. Add conditions (ICP score, connection status), actions (connect, message, view profile, like post), and wait steps. Branch on acceptance. A/B test message variants. Everything runs on autopilot."
            testimonialKey="contact"
            mockupSide="left"
        >
            <div className="p-4 sm:p-5">
                {/* Simplified flowchart */}
                <div className="flex flex-col items-center gap-2">
                    {FLOW_NODES.map((node, index) => (
                        <div key={node.id} className="flex flex-col items-center">
                            <FlowNodeCard node={node} />
                            {index < FLOW_NODES.length - 1 && (
                                <div className="h-4 w-px bg-gradient-to-b from-purple-500/40 to-purple-500/20" />
                            )}
                        </div>
                    ))}
                    {/* End node */}
                    <div className="h-4 w-px bg-gradient-to-b from-purple-500/40 to-purple-500/20" />
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                </div>
            </div>
        </FeatureBlock>
    );
}

function FlowNodeCard({ node }: { node: FlowNode }) {
    const styles: Record<FlowNode["type"], string> = {
        start: "bg-blue-500/15 border-blue-500/30 text-blue-300",
        action: "bg-purple-500/15 border-purple-500/30 text-purple-300",
        condition: "bg-yellow-500/15 border-yellow-500/30 text-yellow-300",
        wait: "bg-white/[0.04] border-white/[0.08] text-[var(--text-secondary)]",
        end: "bg-red-500/15 border-red-500/30 text-red-300",
    };

    if (node.type === "condition") {
        return (
            <div className={`rotate-0 rounded-lg border px-4 py-2 ${styles[node.type]}`}>
                <div className="flex items-center gap-2 text-xs font-medium">
                    <Target className="h-3 w-3" />
                    {node.label}
                </div>
            </div>
        );
    }

    return (
        <div className={`rounded-lg border px-4 py-2 ${styles[node.type]}`}>
            <div className="flex items-center gap-2 text-xs font-medium">
                {node.icon ?? (
                    node.type === "start" ? <Zap className="h-3 w-3" /> :
                    node.type === "wait" ? <Clock className="h-3 w-3" /> :
                    null
                )}
                {node.label}
            </div>
        </div>
    );
}

/* ---------- Unibox Feature ---------- */

const MOCK_CONVERSATIONS = [
    {
        name: "Sarah Bloomberg",
        preview: "Thanks for reaching out! I'd love to discuss...",
        time: "2m ago",
        unread: true,
    },
    {
        name: "Marcus Lindgren",
        preview: "Can you send me more info about...",
        time: "1h ago",
        unread: true,
    },
    {
        name: "Anna Johansson",
        preview: "Let me check with my team and get back to you.",
        time: "3h ago",
        unread: false,
    },
] as const;

function UniboxFeature() {
    return (
        <FeatureBlock
            icon={<Inbox className="h-3.5 w-3.5" />}
            tag="Unibox"
            title="All replies in one unified inbox"
            description="Every conversation from every LinkedIn account in a single inbox. Reply directly, star important threads, get AI-powered reply suggestions, and track sentiment. Never miss a hot lead again."
            testimonialKey="unibox"
        >
            <div className="flex min-h-[280px]">
                {/* Conversation list */}
                <div className="w-2/5 border-r border-white/[0.06] p-3">
                    <div className="mb-3 flex items-center gap-2 rounded-md border border-white/[0.06] bg-[var(--bg-input)] px-2 py-1.5">
                        <Search className="h-3 w-3 text-[var(--text-muted)]" />
                        <span className="text-[10px] text-[var(--text-muted)]">
                            Search...
                        </span>
                    </div>
                    <div className="space-y-1">
                        {MOCK_CONVERSATIONS.map((conv, i) => (
                            <div
                                key={conv.name}
                                className={`cursor-pointer rounded-lg px-2.5 py-2 transition-colors ${
                                    i === 0
                                        ? "bg-purple-500/10 border border-purple-500/20"
                                        : "hover:bg-white/[0.03]"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-medium text-white sm:text-xs">
                                        {conv.name}
                                    </span>
                                    {conv.unread && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                                    )}
                                </div>
                                <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">
                                    {conv.preview}
                                </p>
                                <span className="mt-0.5 text-[9px] text-[var(--text-muted)]">
                                    {conv.time}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Message thread */}
                <div className="flex w-3/5 flex-col p-3">
                    <div className="mb-3 flex items-center gap-2 border-b border-white/[0.06] pb-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-400/60 to-blue-500/60 text-[8px] font-bold text-white">
                            SB
                        </div>
                        <span className="text-xs font-medium text-white">
                            Sarah Bloomberg
                        </span>
                    </div>

                    <div className="flex-1 space-y-2">
                        {/* Received bubble */}
                        <div className="max-w-[85%] rounded-lg bg-white/[0.06] px-3 py-2">
                            <p className="text-[10px] text-[var(--text-secondary)] sm:text-xs">
                                Thanks for reaching out! I&apos;d love to discuss how this could help our team.
                            </p>
                        </div>

                        {/* Sent bubble */}
                        <div className="ml-auto max-w-[85%] rounded-lg bg-purple-500/20 px-3 py-2">
                            <p className="text-[10px] text-purple-200 sm:text-xs">
                                Great to hear! Would Thursday work for a quick call?
                            </p>
                        </div>

                        {/* AI suggestion */}
                        <div className="rounded-md border border-dashed border-purple-500/30 bg-purple-500/[0.05] px-3 py-2">
                            <p className="text-[9px] font-medium text-purple-300">
                                AI Suggestion
                            </p>
                            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                                &ldquo;Perfect! Here&apos;s my calendar link...&rdquo;
                            </p>
                        </div>
                    </div>

                    {/* Input */}
                    <div className="mt-2 flex items-center gap-2 rounded-md border border-white/[0.08] bg-[var(--bg-input)] px-2 py-1.5">
                        <MessageSquare className="h-3 w-3 text-[var(--text-muted)]" />
                        <span className="text-[10px] text-[var(--text-muted)]">
                            Type a message...
                        </span>
                    </div>
                </div>
            </div>
        </FeatureBlock>
    );
}
