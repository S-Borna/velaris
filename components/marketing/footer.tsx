// Copyright (c) Said Borna. All rights reserved.
import Link from "next/link";

const APP_NAME = "Velaris";

const FOOTER_COLUMNS = [
    {
        title: "Home",
        links: [
            { label: "Features", href: "/#features" },
            { label: "Use Cases", href: "/#use-cases" },
            { label: "Integrations", href: "/#integrations" },
            { label: "Pricing", href: "/#pricing" },
            { label: "Blog", href: "/#blog" },
        ],
    },
    {
        title: "Features",
        links: [
            { label: "Outbound Campaigns", href: "/#features" },
            { label: "Inbound Automations", href: "/#features" },
            { label: "Lead Finder", href: "/#features" },
            { label: "ICP Scoring", href: "/#features" },
            { label: "Unibox", href: "/#features" },
            { label: "Content Assistant", href: "/#content" },
        ],
    },
    {
        title: "Contact",
        links: [
            { label: "Contact Us", href: "mailto:said@saidborna.com" },
            { label: "LinkedIn", href: "https://linkedin.com/in/saidborna" },
        ],
    },
    {
        title: "Resources",
        links: [
            { label: "Blog", href: "/#blog" },
            { label: "Privacy Policy", href: "/#" },
            { label: "Terms of Service", href: "/#" },
        ],
    },
] as const;

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Marketing footer — logo, column links, copyright.
 */
export function Footer() {
    return (
        <footer className="border-t border-white/[0.06] bg-[var(--bg-primary)]">
            <div className="mx-auto max-w-7xl px-6 py-16">
                {/* Top: logo + columns */}
                <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
                    {/* Logo + tagline */}
                    <div className="lg:max-w-xs">
                        <Link href="/" className="flex items-center gap-2.5">
                            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-700 shadow-lg shadow-purple-900/40">
                                <div className="absolute inset-0.5 rounded-full border border-white/20" />
                                <div className="h-2 w-2 rounded-full bg-white/80" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white">
                                {APP_NAME}
                            </span>
                        </Link>
                        <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">
                            Find, message, and close ideal leads on LinkedIn with
                            AI-powered outreach automation. Built for founders,
                            agencies, and growth teams.
                        </p>
                    </div>

                    {/* Link columns */}
                    <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-4">
                        {FOOTER_COLUMNS.map((col) => (
                            <div key={col.title}>
                                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                                    {col.title}
                                </h4>
                                <ul className="space-y-2.5">
                                    {col.links.map((link) => (
                                        <li key={link.label}>
                                            <a
                                                href={link.href}
                                                className="text-sm text-[var(--text-muted)] transition-colors hover:text-white"
                                            >
                                                {link.label}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom: copyright */}
                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 sm:flex-row">
                    <p className="text-xs text-[var(--text-muted)]">
                        &copy; {CURRENT_YEAR} {APP_NAME}. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                        <a href="#" className="transition-colors hover:text-white">
                            Terms
                        </a>
                        <a href="#" className="transition-colors hover:text-white">
                            Privacy
                        </a>
                        <a href="#" className="transition-colors hover:text-white">
                            Cookies
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
