// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    TOP_NAV_ITEMS,
    NAV_GROUPS,
    Plus,
    type NavItem,
} from "@/lib/constants/navigation";
import { Menu, ChevronDown, Check, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

const APP_NAME = "Velaris";
const SIDEBAR_WIDTH = "220px";
const CREATE_CAMPAIGN_LABEL = "+ Create Campaign";
const SENDER_COUNT = 1;

interface Workspace {
    id: string;
    name: string;
    plan: string;
    memberCount: number;
}

const WORKSPACES: Workspace[] = [
    { id: "ws-1", name: "Personal", plan: "Solo", memberCount: 1 },
    { id: "ws-2", name: "Said's Team", plan: "Team", memberCount: 4 },
];

const DEFAULT_WORKSPACE_ID = "ws-1";

/**
 * Workspace switcher dropdown — allows switching between workspaces.
 */
function WorkspaceSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [activeId, setActiveId] = useState(DEFAULT_WORKSPACE_ID);
    const active = WORKSPACES.find((ws) => ws.id === activeId) ?? WORKSPACES[0];

    function closeDropdown(): void {
        setIsClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, 180);
    }

    return (
        <div className="relative px-3 pt-2 pb-1">
            <button
                type="button"
                onClick={() => {
                    if (isOpen) {
                        closeDropdown();
                    } else {
                        setIsOpen(true);
                    }
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.05]"
                aria-label="Switch workspace"
            >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gradient-to-br from-teal-400/20 to-green-400/20 text-[10px] font-bold text-teal-300">
                    {active.name[0]}
                </div>
                <span className="flex-1 truncate text-xs font-medium text-[var(--text-primary)]">
                    {active.name}
                </span>
                <ChevronDown className={cn("h-3 w-3 text-[var(--text-muted)] transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className={cn(
                    "absolute left-3 right-3 top-full z-50 mt-1 overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)] p-1 shadow-2xl shadow-black/40 backdrop-blur-xl",
                    isClosing ? "animate-dropdown-exit" : "animate-dropdown-enter",
                )}>
                    {WORKSPACES.map((ws) => (
                        <button
                            key={ws.id}
                            type="button"
                            onClick={() => {
                                setActiveId(ws.id);
                                closeDropdown();
                            }}
                            className={cn(
                                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors duration-100",
                                ws.id === activeId
                                    ? "bg-purple-500/10 text-purple-300"
                                    : "text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)]"
                            )}
                        >
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-gradient-to-br from-teal-400/20 to-green-400/20 text-[9px] font-bold text-teal-300">
                                {ws.name[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium">{ws.name}</p>
                                <p className="text-[10px] text-[var(--text-muted)]">{ws.plan} · {ws.memberCount} member{ws.memberCount !== 1 ? "s" : ""}</p>
                            </div>
                            {ws.id === activeId && <Check className="h-3 w-3 text-purple-400" />}
                        </button>
                    ))}
                    <Separator className="my-1 bg-white/6" />
                    <button
                        type="button"
                        onClick={() => closeDropdown()}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-purple-300 transition-colors duration-100 hover:bg-white/[0.06]"
                    >
                        <Plus className="h-3 w-3" />
                        Create Workspace
                    </button>
                </div>
            )}
        </div>
    );
}

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
function SidebarNavItem({
    item,
    isActive,
    onClick,
}: {
    item: NavItem;
    isActive: boolean;
    onClick?: () => void;
}) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                isActive
                    ? "bg-[var(--bg-hover)] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-[var(--text-primary)]",
            )}
            aria-current={isActive ? "page" : undefined}
        >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
        </Link>
    );
}

/**
 * Inner sidebar content — shared between desktop fixed sidebar and mobile sheet.
 */
function SidebarContent({
    userName,
    pathname,
    onNavClick,
}: {
    userName: string;
    pathname: string;
    onNavClick?: () => void;
}) {
    return (
        <>
            {/* Workspace Switcher */}
            <WorkspaceSwitcher />

            {/* Logo */}
            <div className="flex h-14 items-center gap-2.5 px-4">
                <div
                    className="h-7 w-7 shrink-0 rounded-md bg-[#8B5CF6]"
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
                    className="w-full justify-start gap-2 bg-[var(--purple-500)] text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--purple-600)] hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-[1px]"
                    size="sm"
                >
                    <Link href="/campaigns/new" onClick={onNavClick}>
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
                            onClick={onNavClick}
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
                                        onClick={onNavClick}
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
                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
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
                <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="shrink-0 rounded-lg p-1.5 text-[var(--text-muted)] transition-colors duration-150 hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Log out"
                    title="Log out"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </>
    );
}

interface SidebarProps {
    userName: string;
}

/**
 * Main sidebar navigation — fixed on desktop, slide-out sheet on mobile.
 */
export function Sidebar({ userName }: SidebarProps) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <>
            {/* Desktop sidebar — hidden on mobile */}
            <aside
                className="fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-white/6 bg-[var(--bg-secondary)] md:flex"
                style={{ width: SIDEBAR_WIDTH }}
                aria-label="Main navigation"
            >
                <SidebarContent userName={userName} pathname={pathname} />
            </aside>

            {/* Mobile sidebar — sheet overlay */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                    <button
                        type="button"
                        className="fixed left-4 top-3.5 z-50 rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-white/[0.05] hover:text-white md:hidden"
                        aria-label="Open navigation menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </SheetTrigger>
                <SheetContent
                    side="left"
                    className="w-[260px] border-r border-white/6 bg-[var(--bg-secondary)] p-0"
                >
                    <div className="flex h-full flex-col">
                        <SidebarContent
                            userName={userName}
                            pathname={pathname}
                            onNavClick={() => setMobileOpen(false)}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}

/**
 * Exported sidebar width constant for layout margin calculations.
 */
export { SIDEBAR_WIDTH };
