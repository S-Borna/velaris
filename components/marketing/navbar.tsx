// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    ChevronDown,
    Menu,
    X,
} from "lucide-react";

const APP_NAME = "OutreachPilot";

interface NavLinkSimple {
    label: string;
    href: string;
    hasDropdown?: false;
}

interface NavLinkDropdown {
    label: string;
    hasDropdown: true;
    items: ReadonlyArray<{ label: string; href: string }>;
}

type NavLink = NavLinkSimple | NavLinkDropdown;

const NAV_LINKS: NavLink[] = [
    {
        label: "Product",
        hasDropdown: true,
        items: [
            { label: "Outbound Campaigns", href: "#features" },
            { label: "Lead Finder", href: "#features" },
            { label: "ICP Scoring", href: "#features" },
            { label: "Content Assistant", href: "#content" },
            { label: "Unibox", href: "#features" },
        ],
    },
    { label: "Customers", href: "#use-cases" },
    {
        label: "Resources",
        hasDropdown: true,
        items: [
            { label: "Blog", href: "#blog" },
            { label: "Academy", href: "/academy" },
            { label: "API Docs", href: "#" },
        ],
    },
    { label: "Pricing", href: "#pricing" },
];

const SCROLL_THRESHOLD = 20;

/**
 * Marketing navbar — sticky with backdrop blur on scroll.
 * Logo left, nav links center, auth buttons right.
 * Mobile: hamburger menu with slide-down panel.
 */
export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const handleScroll = useCallback(() => {
        setScrolled(window.scrollY > SCROLL_THRESHOLD);
    }, []);

    useEffect(() => {
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? "bg-[#0B0713]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20"
                    : "bg-transparent"
                }`}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-900/40 transition-shadow group-hover:shadow-purple-500/30">
                        <div className="absolute inset-0.5 rounded-full border border-white/20" />
                        <div className="h-2 w-2 rounded-full bg-white/80" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">
                        {APP_NAME}
                    </span>
                </Link>

                {/* Desktop nav links */}
                <div className="hidden items-center gap-1 lg:flex">
                    {NAV_LINKS.map((link) => (
                        <div
                            key={link.label}
                            className="relative"
                            onMouseEnter={() =>
                                link.hasDropdown
                                    ? setActiveDropdown(link.label)
                                    : undefined
                            }
                            onMouseLeave={() => setActiveDropdown(null)}
                        >
                            {link.hasDropdown ? (
                                <button
                                    type="button"
                                    className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-white"
                                    aria-expanded={activeDropdown === link.label}
                                    aria-haspopup="true"
                                >
                                    {link.label}
                                    <ChevronDown className="h-3.5 w-3.5 transition-transform" />
                                </button>
                            ) : (
                                <a
                                    href={link.href}
                                    className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-white"
                                >
                                    {link.label}
                                </a>
                            )}

                            {/* Dropdown */}
                            {link.hasDropdown && (
                                <AnimatePresence>
                                    {activeDropdown === link.label && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 8 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute left-0 top-full mt-1 min-w-[200px] rounded-xl border border-white/[0.08] bg-[var(--bg-card)] p-2 shadow-2xl shadow-black/40"
                                        >
                                            {link.items.map((item) => (
                                                <a
                                                    key={item.label}
                                                    href={item.href}
                                                    className="block rounded-lg px-3 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-white/[0.05] hover:text-white"
                                                >
                                                    {item.label}
                                                </a>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            )}
                        </div>
                    ))}
                </div>

                {/* Desktop auth buttons */}
                <div className="hidden items-center gap-3 lg:flex">
                    <Link
                        href="/login"
                        className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-white"
                    >
                        Log In
                    </Link>
                    <Link
                        href="/signup"
                        className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0B0713] transition-all hover:bg-white/90 hover:shadow-lg hover:shadow-white/10"
                    >
                        Get Started
                    </Link>
                </div>

                {/* Mobile hamburger */}
                <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-white lg:hidden"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label={mobileOpen ? "Close menu" : "Open menu"}
                >
                    {mobileOpen ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <Menu className="h-5 w-5" />
                    )}
                </button>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-white/[0.06] bg-[#0B0713]/95 backdrop-blur-xl lg:hidden"
                    >
                        <div className="flex flex-col gap-1 px-6 py-4">
                            {NAV_LINKS.map((link) => (
                                <div key={link.label}>
                                    {link.hasDropdown ? (
                                        <>
                                            <span className="block px-3 py-2.5 text-sm font-medium text-white">
                                                {link.label}
                                            </span>
                                            {link.items.map((item) => (
                                                <a
                                                    key={item.label}
                                                    href={item.href}
                                                    className="block rounded-lg px-6 py-2 text-sm text-[var(--text-secondary)] hover:text-white"
                                                    onClick={() =>
                                                        setMobileOpen(false)
                                                    }
                                                >
                                                    {item.label}
                                                </a>
                                            ))}
                                        </>
                                    ) : (
                                        <a
                                            href={link.href}
                                            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-white"
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            {link.label}
                                        </a>
                                    )}
                                </div>
                            ))}
                            <div className="mt-3 flex flex-col gap-2 border-t border-white/[0.06] pt-4">
                                <Link
                                    href="/login"
                                    className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-[var(--text-secondary)] hover:text-white"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Log In
                                </Link>
                                <Link
                                    href="/signup"
                                    className="rounded-full bg-white px-5 py-2.5 text-center text-sm font-semibold text-[#0B0713]"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
