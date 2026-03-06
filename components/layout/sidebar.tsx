// Copyright (c) Said Borna. All rights reserved.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    TOP_NAV_ITEMS,
    NAV_GROUPS,
    Plus,
    type NavItem,
} from "@/lib/constants/navigation";

const APP_NAME = "OutreachPilot";
const SIDEBAR_WIDTH = "220px";
const CREATE_CAMPAIGN_LABEL = "+ Create Campaign";
const SENDER_COUNT = 1;

/**
 * Returns the user's initials from their full name.
 */
function getInitials(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Renders a single sidebar navigation link.
 */
function SidebarNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                    ? "bg-[var(--bg-hover)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]",
            )}
            aria-current={isActive ? "page" : undefined}
        >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
        </Link>
    );
}

interface SidebarProps {
    userName: string;
}

/**
 * Main sidebar navigation — fixed left panel with grouped navigation items.
 * Matches Velaris's exact sidebar hierarchy.
 */
export function Sidebar({ userName }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside
            className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/6 bg-[var(--bg-secondary)]"
            style={{ width: SIDEBAR_WIDTH }}
            aria-label="Main navigation"
        >
            {/* Logo */}
            <div className="flex h-14 items-center gap-2.5 px-4">
                <div
                    className="h-7 w-7 shrink-0 rounded-md"
                    style={{
                        background: "linear-gradient(135deg, #8B5CF6, #A855F7)",
                    }}
                    aria-hidden="true"
                />
                <span className="text-base font-bold tracking-tight text-[var(--text-primary)]">
                    {APP_NAME}
                </span>
            </div>

            {/* Create Campaign CTA */}
            <div className="px-3 pb-2">
                <Button
                    asChild
                    className="w-full justify-start gap-2 bg-gradient-to-r from-[var(--purple-500)] to-[#A855F7] text-sm font-medium text-white hover:from-[var(--purple-600)] hover:to-[var(--purple-500)]"
                    size="sm"
                >
                    <Link href="/campaigns/new">
                        <Plus className="h-4 w-4" />
                        {CREATE_CAMPAIGN_LABEL}
                    </Link>
                </Button>
            </div>

            <Separator className="bg-white/6" />

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 py-2">
                <nav className="flex flex-col gap-1">
                    {/* Top-level items */}
                    {TOP_NAV_ITEMS.map((item) => (
                        <SidebarNavItem
                            key={item.href}
                            item={item}
                            isActive={pathname === item.href}
                        />
                    ))}

                    {/* Grouped sections */}
                    {NAV_GROUPS.map((group) => (
                        <div key={group.title} className="mt-4">
                            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                {group.title}
                            </p>
                            <div className="flex flex-col gap-0.5">
                                {group.items.map((item) => (
                                    <SidebarNavItem
                                        key={item.href}
                                        item={item}
                                        isActive={pathname.startsWith(item.href)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
            </ScrollArea>

            <Separator className="bg-white/6" />

            {/* User section */}
            <div className="flex items-center gap-3 p-3">
                <Avatar className="h-8 w-8 border border-white/10">
                    <AvatarFallback className="bg-[var(--bg-hover)] text-xs text-[var(--text-secondary)]">
                        {getInitials(userName || "User")}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {userName || "User"}
                    </span>
                    <Badge
                        variant="secondary"
                        className="mt-0.5 w-fit text-[10px] font-normal text-[var(--text-muted)]"
                    >
                        {SENDER_COUNT} Sender
                    </Badge>
                </div>
            </div>
        </aside>
    );
}
