// Copyright (c) Said Borna. All rights reserved.

import {
    LayoutDashboard,
    Inbox,
    Linkedin,
    Megaphone,
    Search,
    Database,
    PenTool,
    Zap,
    Puzzle,
    GraduationCap,
    Settings,
    ChevronLeft,
    Plus,
    type LucideIcon,
} from "lucide-react";

/** Sidebar navigation item definition. */
export interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

/** Sidebar navigation group definition. */
export interface NavGroup {
    title: string;
    items: NavItem[];
}

/** Top-level (ungrouped) navigation items. */
export const TOP_NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Unibox", href: "/unibox", icon: Inbox },
];

/** Grouped navigation sections. */
export const NAV_GROUPS: NavGroup[] = [
    {
        title: "CAMPAIGNS",
        items: [
            { label: "LinkedIn Accounts", href: "/linkedin/accounts", icon: Linkedin },
            { label: "Campaigns", href: "/campaigns", icon: Megaphone },
            { label: "Lead Extractor", href: "/leads/extractor", icon: Search },
            { label: "Lead Database", href: "/leads/database", icon: Database },
        ],
    },
    {
        title: "AUTOMATIONS",
        items: [
            { label: "Content Assistant", href: "/content/assistant", icon: PenTool },
            { label: "Inbound Automations", href: "/automations/inbound", icon: Zap },
        ],
    },
    {
        title: "GENERAL",
        items: [
            { label: "Integrations", href: "/integrations", icon: Puzzle },
            { label: "Academy", href: "/academy", icon: GraduationCap },
            { label: "Settings", href: "/settings", icon: Settings },
        ],
    },
];

export { ChevronLeft, Plus };
