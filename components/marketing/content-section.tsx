// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    PenLine,
    Calendar,
    Workflow,
    ArrowRight,
    Sparkles,
    Globe,
    Users,
    MessageSquare,
    ThumbsUp,
    Send as SendIcon,
    Clock,
    CheckCircle2,
} from "lucide-react";
import { AnimatedSection, fadeInUp } from "./animations";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface ContentTab {
    id: string;
    label: string;
    icon: React.ReactNode;
}

const CONTENT_TABS: ContentTab[] = [
    { id: "create", label: "Create", icon: <PenLine className="h-4 w-4" /> },
    { id: "schedule", label: "Schedule", icon: <Calendar className="h-4 w-4" /> },
    { id: "automate", label: "Automate", icon: <Workflow className="h-4 w-4" /> },
];

/**
 * Content section — "But outreach is only half the puzzle"
 * Tabbed subsections: Create / Schedule / Automate.
 */
export function ContentSection() {
    const [activeTab, setActiveTab] = useState("create");

    return (
        <section id="content" className="relative bg-[var(--bg-primary)] py-20 sm:py-28">
            {/* Divider text */}
            <AnimatedSection className="mx-auto max-w-3xl px-6 text-center">
                <p className="text-sm font-medium uppercase tracking-widest text-purple-400">
                    Content Engine
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                    But outreach is only half the puzzle
                </h2>
                <p className="mt-4 text-base text-[var(--text-secondary)]">
                    Build authority, attract inbound leads, and automate engagement — all from one platform.
                </p>
            </AnimatedSection>

            {/* Tab bar */}
            <div className="mx-auto mt-12 flex max-w-7xl justify-center px-6">
                <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1.5">
                    {CONTENT_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                                activeTab === tab.id
                                    ? "bg-purple-500/15 text-purple-300 shadow-sm"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content */}
            <div className="mx-auto mt-10 max-w-7xl px-6">
                <AnimatePresence mode="wait">
                    {activeTab === "create" && (
                        <TabPanel key="create">
                            <CreateTab />
                        </TabPanel>
                    )}
                    {activeTab === "schedule" && (
                        <TabPanel key="schedule">
                            <ScheduleTab />
                        </TabPanel>
                    )}
                    {activeTab === "automate" && (
                        <TabPanel key="automate">
                            <AutomateTab />
                        </TabPanel>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}

function TabPanel({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
        >
            {children}
        </motion.div>
    );
}

/* ---------- Create Tab ---------- */

const CATEGORIES = ["Thought Leadership", "Case Study", "Tips & Tricks", "Industry News", "Personal Story"] as const;
const TONES = ["Professional", "Casual", "Inspirational", "Educational", "Humorous"] as const;

function CreateTab() {
    return (
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
            {/* Left: description + testimonial */}
            <div className="flex-shrink-0 lg:w-64">
                <h3 className="text-xl font-bold text-white">
                    Write LinkedIn posts with AI
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                    Generate scroll-stopping content tailored to your audience and brand voice.
                    Multiple variants, performance predictions, and one-click scheduling.
                </p>
                <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                    <p className="text-sm font-medium text-white">&ldquo;I got 100,000 impressions in 14 days&rdquo;</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Bendik Fausto @ Staffer</p>
                </div>
            </div>

            {/* Center: form mockup */}
            <div className="flex-1 overflow-hidden rounded-xl border border-white/[0.08] bg-[var(--bg-card)]">
                <div className="border-b border-white/[0.06] px-5 py-3">
                    <div className="flex gap-4 text-xs font-medium">
                        <span className="border-b-2 border-purple-500 pb-2 text-purple-300">Create Post</span>
                        <span className="pb-2 text-[var(--text-muted)]">Lead Magnets</span>
                        <span className="pb-2 text-[var(--text-muted)]">Library</span>
                        <span className="pb-2 text-[var(--text-muted)]">Schedule</span>
                    </div>
                </div>
                <div className="space-y-4 p-5">
                    <FormField label="Category">
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map((c, i) => (
                                <span
                                    key={c}
                                    className={`rounded-md px-3 py-1.5 text-[10px] font-medium sm:text-xs ${
                                        i === 0
                                            ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                                            : "bg-white/[0.03] text-[var(--text-muted)] border border-white/[0.06]"
                                    }`}
                                >
                                    {c}
                                </span>
                            ))}
                        </div>
                    </FormField>
                    <FormField label="Topic">
                        <div className="rounded-lg border border-white/[0.08] bg-[var(--bg-input)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                            How AI is transforming B2B sales outreach in 2026
                        </div>
                    </FormField>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Target Audience">
                            <div className="rounded-lg border border-white/[0.08] bg-[var(--bg-input)] px-3 py-2 text-xs text-[var(--text-muted)]">
                                <Users className="mr-1 inline h-3 w-3" /> SaaS Founders
                            </div>
                        </FormField>
                        <FormField label="Language">
                            <div className="rounded-lg border border-white/[0.08] bg-[var(--bg-input)] px-3 py-2 text-xs text-[var(--text-muted)]">
                                <Globe className="mr-1 inline h-3 w-3" /> English
                            </div>
                        </FormField>
                    </div>
                    <FormField label="Tone">
                        <div className="flex flex-wrap gap-2">
                            {TONES.map((t, i) => (
                                <span
                                    key={t}
                                    className={`rounded-md px-3 py-1.5 text-[10px] font-medium sm:text-xs ${
                                        i === 0
                                            ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                                            : "bg-white/[0.03] text-[var(--text-muted)] border border-white/[0.06]"
                                    }`}
                                >
                                    {t}
                                </span>
                            ))}
                        </div>
                    </FormField>
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20"
                    >
                        <Sparkles className="h-4 w-4" />
                        Generate Content
                    </button>
                </div>
            </div>

            {/* Right: post preview */}
            <div className="flex-1 overflow-hidden rounded-xl border border-white/[0.08] bg-[var(--bg-card)]">
                <div className="border-b border-white/[0.06] px-5 py-3">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">Post Preview</span>
                </div>
                <div className="p-5">
                    {/* Author header */}
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400/60 to-blue-500/60" />
                        <div>
                            <p className="text-sm font-semibold text-white">Martin Smith</p>
                            <p className="text-[10px] text-[var(--text-muted)]">CEO & Founder @ Stealth AI</p>
                        </div>
                    </div>

                    {/* Post content */}
                    <div className="mt-4 space-y-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                        <p>🚀 AI is not replacing salespeople — it&apos;s giving them superpowers.</p>
                        <p>Last month, we automated our LinkedIn outreach and saw:</p>
                        <p>→ 52% connection acceptance rate<br />→ 24% reply rate<br />→ 90 calls booked on autopilot</p>
                        <p>The key? Personalization at scale. Here&apos;s how we did it...</p>
                    </div>

                    {/* Engagement */}
                    <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-3 text-[10px] text-[var(--text-muted)]">
                        <span>259 reactions · 34 comments</span>
                    </div>
                    <div className="mt-2 flex items-center gap-6 text-[10px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Like</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Comment</span>
                        <span className="flex items-center gap-1"><ArrowRight className="h-3 w-3" /> Repost</span>
                        <span className="flex items-center gap-1"><SendIcon className="h-3 w-3" /> Send</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                {label}
            </label>
            {children}
        </div>
    );
}

/* ---------- Schedule Tab ---------- */

const SCHEDULED_POSTS = [
    { author: "Elliot N.", time: "Tomorrow, 9:00 AM", preview: "3 mistakes founders make with LinkedIn outreach...", status: "scheduled" as const },
    { author: "Sarah K.", time: "Mar 8, 11:30 AM", preview: "Why cold DMs still work in 2026 (when done right)...", status: "scheduled" as const },
    { author: "Marcus W.", time: "Mar 9, 2:00 PM", preview: "Our team grew 40% YoY — here's what I learned...", status: "scheduled" as const },
] as const;

const POSTED = [
    { author: "Elliot N.", time: "2 hours ago", preview: "Just crossed 1,000 connections this month 🎯", likes: 142, comments: 23 },
    { author: "Sarah K.", time: "Yesterday", preview: "The #1 reason your outreach messages get ignored...", likes: 289, comments: 41 },
] as const;

function ScheduleTab() {
    return (
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
            {/* Left description */}
            <div className="flex-shrink-0 lg:w-64">
                <h3 className="text-xl font-bold text-white">
                    Schedule content on multiple profiles
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                    Queue posts across all your LinkedIn accounts. Visual calendar, optimal timing suggestions, and bulk scheduling.
                </p>
                <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                    <p className="text-sm font-medium text-white">8K+</p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">BecGrowth — LinkedIn followers gained</p>
                </div>
            </div>

            {/* Scheduled column */}
            <div className="flex-1 overflow-hidden rounded-xl border border-white/[0.08] bg-[var(--bg-card)]">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">Scheduled</span>
                    <span className="rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-[10px] font-medium text-yellow-300">
                        {SCHEDULED_POSTS.length}
                    </span>
                </div>
                <div className="divide-y divide-white/[0.04] p-2">
                    {SCHEDULED_POSTS.map((post) => (
                        <div key={post.preview} className="flex items-start gap-3 px-3 py-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400/60 to-blue-500/60 text-[10px] font-bold text-white">
                                {post.author.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-white">{post.author}</span>
                                    <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                                        <Clock className="h-3 w-3" /> {post.time}
                                    </span>
                                </div>
                                <p className="mt-1 truncate text-[10px] text-[var(--text-muted)] sm:text-xs">{post.preview}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Posted column */}
            <div className="flex-1 overflow-hidden rounded-xl border border-white/[0.08] bg-[var(--bg-card)]">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">Posted</span>
                    <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 text-[10px] font-medium text-green-300">
                        27
                    </span>
                </div>
                <div className="divide-y divide-white/[0.04] p-2">
                    {POSTED.map((post) => (
                        <div key={post.preview} className="flex items-start gap-3 px-3 py-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-400/60 to-blue-500/60 text-[10px] font-bold text-white">
                                {post.author.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-white">{post.author}</span>
                                    <span className="text-[10px] text-[var(--text-muted)]">{post.time}</span>
                                </div>
                                <p className="mt-1 truncate text-[10px] text-[var(--text-muted)] sm:text-xs">{post.preview}</p>
                                <div className="mt-1.5 flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                                    <span><ThumbsUp className="mr-0.5 inline h-3 w-3" /> {post.likes}</span>
                                    <span><MessageSquare className="mr-0.5 inline h-3 w-3" /> {post.comments}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ---------- Automate Tab ---------- */

const WIZARD_STEPS = [
    { number: 1, label: "Details", description: "Campaign name & post URL" },
    { number: 2, label: "Action Words", description: "Trigger keywords" },
    { number: 3, label: "Message", description: "Auto-reply & DM" },
    { number: 4, label: "Senders", description: "LinkedIn accounts" },
    { number: 5, label: "Review", description: "Launch automation" },
] as const;

function AutomateTab() {
    return (
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
            {/* Left description */}
            <div className="flex-shrink-0 lg:w-64">
                <h3 className="text-xl font-bold text-white">
                    Automate inbound workflows that convert
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                    Monitor posts for trigger keywords and automatically reply + DM engaged prospects. Turn every viral post into a pipeline.
                </p>
                <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                    <p className="text-sm font-medium text-white">2.2K</p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">A-Leads — New connections through automated inbound</p>
                </div>
            </div>

            {/* Wizard preview */}
            <div className="flex-1 overflow-hidden rounded-xl border border-white/[0.08] bg-[var(--bg-card)]">
                <div className="border-b border-white/[0.06] px-5 py-3">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">Inbound Campaign Wizard</span>
                </div>
                <div className="p-5">
                    {/* Steps */}
                    <div className="flex items-center justify-between">
                        {WIZARD_STEPS.map((step, i) => (
                            <div key={step.number} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                                        i === 0
                                            ? "bg-purple-500 text-white"
                                            : i < 3
                                                ? "bg-purple-500/20 text-purple-300"
                                                : "bg-white/[0.06] text-[var(--text-muted)]"
                                    }`}>
                                        {i < 3 ? <CheckCircle2 className="h-4 w-4" /> : step.number}
                                    </div>
                                    <span className="mt-1.5 text-[10px] font-medium text-[var(--text-secondary)]">
                                        {step.label}
                                    </span>
                                </div>
                                {i < WIZARD_STEPS.length - 1 && (
                                    <div className={`mx-2 h-px w-8 sm:w-12 ${
                                        i < 2 ? "bg-purple-500/40" : "bg-white/[0.06]"
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Current step content mock */}
                    <div className="mt-6 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                        <label className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
                            Direct Message
                        </label>
                        <div className="rounded-lg border border-white/[0.08] bg-[var(--bg-input)] p-3 text-xs text-[var(--text-secondary)]">
                            Hey {"{first_name}"}, thanks for your interest! Here&apos;s the resource I mentioned: [link]. Let me know if you have questions! 🚀
                        </div>

                        <label className="mb-2 mt-4 block text-xs font-medium text-[var(--text-secondary)]">
                            Comment Replies
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {["Sent it! ✅", "Done, check your DMs!", "You got it 🎯"].map((reply) => (
                                <span key={reply} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[10px] text-[var(--text-secondary)] sm:text-xs">
                                    {reply}
                                    <span className="cursor-pointer text-[var(--text-muted)] hover:text-red-400">×</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
