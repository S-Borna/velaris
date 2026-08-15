// Copyright (c) Said Borna. All rights reserved.
"use client";

import { ArrowRight, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedSection, AnimatedGroup, fadeInUpCard } from "./animations";

interface BlogPost {
    category: string;
    categoryColor: string;
    date: string;
    title: string;
    description: string;
}

const BLOG_POSTS: BlogPost[] = [
    {
        category: "All-bound",
        categoryColor: "bg-purple-500/15 text-purple-300",
        date: "Mar 1, 2026",
        title: "The Complete Guide to All-Bound LinkedIn Marketing in 2026",
        description:
            "Learn how to combine outbound automation with inbound content to create a self-reinforcing growth engine on LinkedIn.",
    },
    {
        category: "Outbound",
        categoryColor: "bg-blue-500/15 text-blue-300",
        date: "Feb 24, 2026",
        title: "Why Your LinkedIn Connection Requests Get Ignored (And How to Fix It)",
        description:
            "52% acceptance rates aren't magic — they're the result of smart ICP scoring and personalized outreach at scale.",
    },
];

/**
 * Blog section — 2 article preview cards.
 */
export function BlogSection() {
    return (
        <section id="blog" className="relative bg-[var(--bg-primary)] py-20 sm:py-28">
            <AnimatedSection className="mx-auto max-w-3xl px-6 text-center">
                <p className="text-sm font-medium uppercase tracking-widest text-purple-400">
                    Blog
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Get to know more about us
                </h2>
            </AnimatedSection>

            <AnimatedGroup className="mx-auto mt-12 grid max-w-4xl gap-6 px-6 md:grid-cols-2">
                {BLOG_POSTS.map((post) => (
                    <motion.a
                        key={post.title}
                        href="#"
                        variants={fadeInUpCard}
                        className="group flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[var(--bg-card)] transition-all hover:border-white/[0.15] hover:-translate-y-1"
                    >
                        {/* Thumbnail placeholder */}
                        <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-hover)]">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-16 w-16 rounded-2xl bg-purple-600/20 backdrop-blur-sm" />
                            </div>
                            {/* Category badge */}
                            <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-medium ${post.categoryColor}`}>
                                {post.category}
                            </span>
                        </div>

                        <div className="flex flex-1 flex-col p-5">
                            {/* Date */}
                            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                                <Calendar className="h-3 w-3" />
                                {post.date}
                            </div>

                            {/* Title */}
                            <h3 className="mt-2 text-base font-semibold leading-snug text-white transition-colors group-hover:text-purple-300">
                                {post.title}
                            </h3>

                            {/* Description */}
                            <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                                {post.description}
                            </p>

                            {/* Read more */}
                            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-purple-400 transition-colors group-hover:text-purple-300">
                                Read more
                                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                            </span>
                        </div>
                    </motion.a>
                ))}
            </AnimatedGroup>
        </section>
    );
}
