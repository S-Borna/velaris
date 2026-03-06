// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

const HEADLINE = "Find, Message & Close Ideal Leads on LinkedIn";
const SUBTEXT =
    "OutreachPilot helps you find the right contacts, score them for ICP fit, and automate outreach across unlimited LinkedIn accounts";

const APP_TABS = [
    { label: "Home", active: true },
    { label: "Unibox", active: false },
    { label: "Campaigns", active: false },
    { label: "Leads", active: false },
    { label: "AI Content", active: false },
] as const;

const PARTICLE_COUNT = 60;
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Renders subtle particle/star background effect on a canvas.
 * Lightweight — only uses opacity and translate transforms.
 */
function ParticleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        let particles: Array<{
            x: number;
            y: number;
            size: number;
            opacity: number;
            speed: number;
            twinkleSpeed: number;
            twinkleOffset: number;
        }> = [];

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };

        const initParticles = () => {
            particles = Array.from({ length: PARTICLE_COUNT }, () => ({
                x: Math.random() * canvas.offsetWidth,
                y: Math.random() * canvas.offsetHeight,
                size: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.5 + 0.1,
                speed: Math.random() * 0.15 + 0.05,
                twinkleSpeed: Math.random() * 0.02 + 0.005,
                twinkleOffset: Math.random() * Math.PI * 2,
            }));
        };

        const draw = (time: number) => {
            ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

            for (const p of particles) {
                const twinkle =
                    Math.sin(time * p.twinkleSpeed + p.twinkleOffset) * 0.3 +
                    0.7;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * twinkle})`;
                ctx.fill();

                p.y -= p.speed;
                if (p.y < -5) {
                    p.y = canvas.offsetHeight + 5;
                    p.x = Math.random() * canvas.offsetWidth;
                }
            }

            animationId = requestAnimationFrame(draw);
        };

        resize();
        initParticles();
        animationId = requestAnimationFrame(draw);

        window.addEventListener("resize", resize);
        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
        />
    );
}

/**
 * Hero section — full-viewport dark background with particles,
 * headline, CTAs, app tab bar, and dashboard mockup.
 */
export function Hero() {
    return (
        <section className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden bg-gradient-to-b from-[#0B0713] via-[#110D1D] to-[#0B0713] pt-28 md:pt-36">
            {/* Background effects */}
            <ParticleCanvas />

            {/* Radial purple glow */}
            <div
                className="pointer-events-none absolute top-0 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-purple-600/[0.07] blur-[120px]"
                aria-hidden="true"
            />

            {/* Subtle grid overlay */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                }}
                aria-hidden="true"
            />

            {/* Corner bracket decorations */}
            <div className="pointer-events-none absolute left-[10%] top-[20%] h-16 w-16 border-l-2 border-t-2 border-purple-500/20 opacity-40" aria-hidden="true" />
            <div className="pointer-events-none absolute right-[10%] top-[20%] h-16 w-16 border-r-2 border-t-2 border-purple-500/20 opacity-40" aria-hidden="true" />
            <div className="pointer-events-none absolute left-[10%] bottom-[30%] h-16 w-16 border-l-2 border-b-2 border-purple-500/20 opacity-40" aria-hidden="true" />
            <div className="pointer-events-none absolute right-[10%] bottom-[30%] h-16 w-16 border-r-2 border-b-2 border-purple-500/20 opacity-40" aria-hidden="true" />

            {/* Content */}
            <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE_OUT }}
                    className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-xs font-medium text-purple-300"
                >
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    Now in public beta — Start free today
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT }}
                    className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
                >
                    {HEADLINE}
                </motion.h1>

                {/* Subtext */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.25, ease: EASE_OUT }}
                    className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg"
                >
                    {SUBTEXT}
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4, ease: EASE_OUT }}
                    className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
                >
                    <Link
                        href="/signup"
                        className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30 hover:brightness-110"
                    >
                        Start for Free
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <a
                        href="#features"
                        className="group inline-flex items-center gap-2 rounded-full border border-white/[0.12] px-7 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/25 hover:bg-white/[0.04]"
                    >
                        <Play className="h-3.5 w-3.5" />
                        How it works
                    </a>
                </motion.div>

                {/* App tab bar */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.55, ease: EASE_OUT }}
                    className="mt-12 inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1.5 backdrop-blur-sm"
                >
                    {APP_TABS.map((tab) => (
                        <button
                            key={tab.label}
                            type="button"
                            className={`rounded-full px-4 py-2 text-xs font-medium transition-all sm:px-5 sm:text-sm ${tab.active
                                    ? "bg-white/[0.1] text-white shadow-sm"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </motion.div>
            </div>

            {/* Dashboard mockup */}
            <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7, ease: EASE_OUT }}
                className="relative z-10 mx-auto mt-12 w-full max-w-6xl px-6"
            >
                <div
                    className="overflow-hidden rounded-xl border border-white/[0.08] bg-[var(--bg-card)] shadow-2xl shadow-black/40"
                    style={{
                        transform: "perspective(1200px) rotateX(2deg)",
                    }}
                >
                    <DashboardMockup />
                </div>

                {/* Fade to background at bottom */}
                <div className="pointer-events-none absolute -bottom-1 left-0 right-0 h-32 bg-gradient-to-t from-[#0B0713] to-transparent" aria-hidden="true" />
            </motion.div>
        </section>
    );
}

/* ---------- Dashboard Mockup (static illustration) ---------- */

const MOCK_ACCOUNTS = [
    { name: "Elliot N.", connections: 847, messages: 203, replies: 142 },
    { name: "Sarah K.", connections: 632, messages: 178, replies: 98 },
    { name: "Marcus W.", connections: 1204, messages: 412, replies: 287 },
] as const;

const KPI_DATA = [
    { label: "Connections Sent", value: "2,683", accent: "bg-blue-500", change: "+12%" },
    { label: "Accepted", value: "1,847", accent: "bg-purple-500", change: "+8%" },
    { label: "Messages Sent", value: "793", accent: "bg-orange-500", change: "+24%" },
    { label: "Replies", value: "527", accent: "bg-red-500", change: "+18%" },
    { label: "Opportunities", value: "$86.2K", accent: "bg-cyan-400", change: "+31%" },
] as const;

/**
 * Static dashboard mockup for the hero section.
 * Shows KPI cards + simplified account analytics table.
 */
function DashboardMockup() {
    return (
        <div className="p-5 sm:p-6">
            {/* Header bar */}
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-white">Dashboard</h3>
                    <p className="text-xs text-[var(--text-muted)]">
                        Last 30 days performance
                    </p>
                </div>
                <div className="flex gap-2">
                    <span className="rounded-md bg-white/[0.06] px-3 py-1.5 text-xs text-[var(--text-secondary)]">
                        1 week
                    </span>
                    <span className="rounded-md bg-purple-500/20 px-3 py-1.5 text-xs font-medium text-purple-300">
                        1 month
                    </span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {KPI_DATA.map((kpi) => (
                    <div
                        key={kpi.label}
                        className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                    >
                        <div className={`mb-2 h-0.5 w-8 rounded-full ${kpi.accent}`} />
                        <p className="text-lg font-bold text-white sm:text-xl">
                            {kpi.value}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <p className="text-[10px] text-[var(--text-muted)] sm:text-xs">
                                {kpi.label}
                            </p>
                            <span className="text-[10px] font-medium text-green-400 sm:text-xs">
                                {kpi.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Activity chart placeholder */}
            <div className="mb-5 h-28 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 sm:h-36">
                <div className="flex h-full items-end gap-1.5">
                    {Array.from({ length: 24 }, (_, i) => {
                        const height = 20 + Math.sin(i * 0.5) * 30 + Math.random() * 25;
                        return (
                            <div
                                key={i}
                                className="flex-1 rounded-t bg-gradient-to-t from-purple-500/40 to-purple-400/60"
                                style={{ height: `${height}%` }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Account analytics table */}
            <div className="overflow-hidden rounded-lg border border-white/[0.06]">
                <div className="grid grid-cols-4 gap-4 bg-white/[0.02] px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] sm:text-xs">
                    <span>Account</span>
                    <span className="text-center">Connections</span>
                    <span className="text-center">Messages</span>
                    <span className="text-center">Replies</span>
                </div>
                {MOCK_ACCOUNTS.map((account) => (
                    <div
                        key={account.name}
                        className="grid grid-cols-4 gap-4 border-t border-white/[0.04] px-4 py-3 text-xs sm:text-sm"
                    >
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600" />
                            <span className="text-white">{account.name}</span>
                        </div>
                        <span className="text-center text-[var(--text-secondary)]">
                            {account.connections.toLocaleString()}
                        </span>
                        <span className="text-center text-[var(--text-secondary)]">
                            {account.messages.toLocaleString()}
                        </span>
                        <span className="text-center text-[var(--text-secondary)]">
                            {account.replies.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
