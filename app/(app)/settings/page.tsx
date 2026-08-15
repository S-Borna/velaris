// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Bell,
    Check,
    CreditCard,
    KeyRound,
    Loader2,
    Settings2,
    Shield,
    User,
    Users,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */

type SettingsTab = "profile" | "workspace" | "billing" | "notifications" | "security";

interface UserProfile {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
}

interface WorkspaceData {
    id: string;
    name: string;
    plan: string;
    createdAt: string;
    members?: Array<{
        userId: string;
        role: string;
        user: { fullName: string | null; email: string };
    }>;
}

/* ─── Plan tiers (static — Stripe excluded) ──────── */

const PLANS = [
    {
        name: "Free",
        price: "$0",
        period: "/mo",
        features: ["1 LinkedIn Account", "100 DB Leads/mo", "1 Campaign", "50 ICP Credits"],
        current: false,
    },
    {
        name: "Solo",
        price: "$49",
        period: "/mo",
        features: ["3 LinkedIn Accounts", "2K DB Leads/mo", "10 Campaigns", "500 ICP Credits", "50 AI Posts/mo"],
        current: true,
    },
    {
        name: "Team",
        price: "$149",
        period: "/mo",
        features: ["10 LinkedIn Accounts", "10K DB Leads/mo", "Unlimited Campaigns", "2K ICP Credits", "Unlimited AI Posts"],
        current: false,
    },
    {
        name: "Agency",
        price: "$349",
        period: "/mo",
        features: ["50 LinkedIn Accounts", "50K DB Leads/mo", "Unlimited Campaigns", "10K ICP Credits", "White-label"],
        current: false,
    },
];

/* ─── Notification defaults (local only) ─────────── */

interface NotificationSetting {
    key: string;
    label: string;
    description: string;
    enabled: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationSetting[] = [
    { key: "campaign_complete", label: "Campaign Completed", description: "When a campaign finishes running", enabled: true },
    { key: "new_reply", label: "New Reply", description: "When a lead replies to your message", enabled: true },
    { key: "connection_accepted", label: "Connection Accepted", description: "When a lead accepts your connection request", enabled: false },
    { key: "daily_summary", label: "Daily Summary", description: "Daily email with campaign performance", enabled: true },
    { key: "weekly_report", label: "Weekly Report", description: "Weekly analytics report", enabled: false },
    { key: "account_warning", label: "Account Warning", description: "When a LinkedIn account has issues", enabled: true },
];

/* ─── Component ─────────────────────────────────────── */

/**
 * Settings page — Profile, Workspace, Billing planes, Notifications, Security.
 * Profile & Workspace tabs fetch from real API. Others are static / local.
 */
export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

    // Profile state
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [profileName, setProfileName] = useState("");
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);

    // Workspace state
    const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
    const [workspaceName, setWorkspaceName] = useState("");
    const [workspaceLoading, setWorkspaceLoading] = useState(false);
    const [workspaceSaving, setWorkspaceSaving] = useState(false);
    const [accountCount, setAccountCount] = useState(0);

    // Notifications (local-only)
    const [notifications, setNotifications] = useState<NotificationSetting[]>([
        ...DEFAULT_NOTIFICATIONS,
    ]);

    // Security (local-only)
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    /* ── Fetch profile ─────────────── */

    const fetchProfile = useCallback(async () => {
        setProfileLoading(true);
        try {
            const res = await fetch("/api/settings/profile");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            const data = json.data as UserProfile;
            setProfile(data);
            setProfileName(data.fullName ?? "");
        } catch {
            toast.error("Failed to load profile");
        } finally {
            setProfileLoading(false);
        }
    }, []);

    const fetchWorkspace = useCallback(async () => {
        setWorkspaceLoading(true);
        try {
            const [wsRes, acctRes] = await Promise.all([
                fetch("/api/settings/workspace"),
                fetch("/api/linkedin-accounts"),
            ]);
            if (wsRes.ok) {
                const json = await wsRes.json();
                const data = json.data as WorkspaceData;
                setWorkspace(data);
                setWorkspaceName(data.name);
            }
            if (acctRes.ok) {
                const json = await acctRes.json();
                setAccountCount(json.data?.data?.length ?? 0);
            }
        } catch {
            toast.error("Failed to load workspace");
        } finally {
            setWorkspaceLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "profile") fetchProfile();
        if (activeTab === "workspace") fetchWorkspace();
    }, [activeTab, fetchProfile, fetchWorkspace]);

    /* ── Save handlers ─────────────── */

    async function saveProfile(): Promise<void> {
        setSaving(true, "profile");
        try {
            const res = await fetch("/api/settings/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName: profileName.trim() }),
            });
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            setProfile(json.data as UserProfile);
            toast.success("Profile updated");
        } catch {
            toast.error("Failed to update profile");
        } finally {
            setSaving(false, "profile");
        }
    }

    async function saveWorkspace(): Promise<void> {
        setSaving(true, "workspace");
        try {
            const res = await fetch("/api/settings/workspace", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: workspaceName.trim() }),
            });
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            setWorkspace(json.data as WorkspaceData);
            toast.success("Workspace updated");
        } catch {
            toast.error("Failed to update workspace");
        } finally {
            setSaving(false, "workspace");
        }
    }

    function setSaving(value: boolean, which: "profile" | "workspace"): void {
        if (which === "profile") setProfileSaving(value);
        else setWorkspaceSaving(value);
    }

    function toggleNotification(key: string): void {
        setNotifications((prev) =>
            prev.map((n) => (n.key === key ? { ...n, enabled: !n.enabled } : n)),
        );
        toast.success("Notification preference updated");
    }

    /* ── Tabs ──────────────────────── */

    const tabs: { value: SettingsTab; label: string; icon: typeof User }[] = [
        { value: "profile", label: "Profile", icon: User },
        { value: "workspace", label: "Workspace", icon: Users },
        { value: "billing", label: "Billing", icon: CreditCard },
        { value: "notifications", label: "Notifications", icon: Bell },
        { value: "security", label: "Security", icon: Shield },
    ];

    return (
        <div className="flex h-full flex-1 flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-white/6 px-6 py-4">
                <div>
                    <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                        Settings
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Manage your profile, workspace, billing, and preferences
                    </p>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar tabs */}
                <div className="w-52 flex-shrink-0 border-r border-white/6 p-4">
                    <div className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                    activeTab === tab.value
                                        ? "bg-purple-500/15 text-purple-300"
                                        : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                                }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="mx-auto max-w-2xl space-y-6">
                        {/* ── Profile tab ── */}
                        {activeTab === "profile" && (
                            <>
                                {profileLoading ? (
                                    <div className="space-y-4">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="h-12 animate-pulse rounded-lg bg-white/5"
                                            />
                                        ))}
                                    </div>
                                ) : profile ? (
                                    <>
                                        <div className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-5">
                                            <h3 className="mb-4 text-sm font-medium text-[var(--text-primary)]">
                                                Profile Information
                                            </h3>

                                            {/* Avatar */}
                                            <div className="mb-5 flex items-center gap-4">
                                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600/25 text-xl font-bold text-purple-300">
                                                    {(profile.fullName ?? profile.email)
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                                        {profile.fullName ?? "—"}
                                                    </p>
                                                    <p className="text-xs text-[var(--text-muted)]">
                                                        {profile.email}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)]">
                                                        Full Name
                                                    </label>
                                                    <Input
                                                        value={profileName}
                                                        onChange={(e) =>
                                                            setProfileName(e.target.value)
                                                        }
                                                        className="h-10 border-white/10 bg-[var(--bg-input)] text-sm text-[var(--text-primary)] focus:border-purple-500/50"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)]">
                                                        Email
                                                    </label>
                                                    <Input
                                                        value={profile.email}
                                                        disabled
                                                        className="h-10 border-white/10 bg-[var(--bg-input)] text-sm text-[var(--text-muted)] opacity-60"
                                                    />
                                                    <p className="text-[10px] text-[var(--text-muted)]">
                                                        Email cannot be changed
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-5 flex justify-end">
                                                <Button
                                                    onClick={saveProfile}
                                                    disabled={profileSaving}
                                                    className="gap-1.5 bg-purple-600 text-white hover:bg-purple-500"
                                                >
                                                    {profileSaving ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Check className="h-4 w-4" />
                                                    )}
                                                    Save Changes
                                                </Button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-[var(--text-muted)]">
                                        Could not load profile
                                    </p>
                                )}
                            </>
                        )}

                        {/* ── Workspace tab ── */}
                        {activeTab === "workspace" && (
                            <>
                                {workspaceLoading ? (
                                    <div className="space-y-4">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="h-12 animate-pulse rounded-lg bg-white/5"
                                            />
                                        ))}
                                    </div>
                                ) : workspace ? (
                                    <>
                                        {/* Summary cards */}
                                        <div className="grid grid-cols-3 gap-4">
                                            {[
                                                {
                                                    label: "Plan",
                                                    value:
                                                        workspace.plan
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                        workspace.plan.slice(1),
                                                    icon: CreditCard,
                                                },
                                                {
                                                    label: "LinkedIn Accounts",
                                                    value: accountCount,
                                                    icon: Users,
                                                },
                                                {
                                                    label: "Members",
                                                    value: workspace.members?.length ?? 1,
                                                    icon: User,
                                                },
                                            ].map((card) => (
                                                <div
                                                    key={card.label}
                                                    className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-4"
                                                >
                                                    <div className="mb-1 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                                        <card.icon className="h-3.5 w-3.5" />
                                                        {card.label}
                                                    </div>
                                                    <p className="text-xl font-semibold text-[var(--text-primary)]">
                                                        {card.value}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Workspace settings */}
                                        <div className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-5">
                                            <h3 className="mb-4 text-sm font-medium text-[var(--text-primary)]">
                                                Workspace Settings
                                            </h3>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)]">
                                                        Workspace Name
                                                    </label>
                                                    <Input
                                                        value={workspaceName}
                                                        onChange={(e) =>
                                                            setWorkspaceName(e.target.value)
                                                        }
                                                        className="h-10 border-white/10 bg-[var(--bg-input)] text-sm text-[var(--text-primary)] focus:border-purple-500/50"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-[var(--text-secondary)]">
                                                        Workspace ID
                                                    </label>
                                                    <Input
                                                        value={workspace.id}
                                                        disabled
                                                        className="h-10 border-white/10 bg-[var(--bg-input)] text-sm text-[var(--text-muted)] opacity-60"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-5 flex justify-end">
                                                <Button
                                                    onClick={saveWorkspace}
                                                    disabled={workspaceSaving}
                                                    className="gap-1.5 bg-purple-600 text-white hover:bg-purple-500"
                                                >
                                                    {workspaceSaving ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Check className="h-4 w-4" />
                                                    )}
                                                    Save Changes
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Members */}
                                        {workspace.members &&
                                            workspace.members.length > 0 && (
                                                <div className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-5">
                                                    <h3 className="mb-4 text-sm font-medium text-[var(--text-primary)]">
                                                        Members
                                                    </h3>
                                                    <div className="space-y-3">
                                                        {workspace.members.map((m) => (
                                                            <div
                                                                key={m.userId}
                                                                className="flex items-center justify-between"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-300">
                                                                        {(
                                                                            m.user
                                                                                .fullName ??
                                                                            m.user.email
                                                                        )
                                                                            .charAt(0)
                                                                            .toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm text-[var(--text-primary)]">
                                                                            {m.user
                                                                                .fullName ??
                                                                                m.user.email}
                                                                        </p>
                                                                        <p className="text-xs text-[var(--text-muted)]">
                                                                            {m.user.email}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-white/10 text-[10px] text-[var(--text-muted)]"
                                                                >
                                                                    {m.role
                                                                        .charAt(0)
                                                                        .toUpperCase() +
                                                                        m.role.slice(1)}
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                    </>
                                ) : (
                                    <p className="text-sm text-[var(--text-muted)]">
                                        Could not load workspace
                                    </p>
                                )}
                            </>
                        )}

                        {/* ── Billing tab (static) ── */}
                        {activeTab === "billing" && (
                            <>
                                <div className="mb-4 rounded-xl border border-white/6 bg-[var(--bg-card)] p-5">
                                    <h3 className="mb-1 text-sm font-medium text-[var(--text-primary)]">
                                        Current Plan
                                    </h3>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        Manage your subscription and billing details
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {PLANS.map((plan) => (
                                        <div
                                            key={plan.name}
                                            className={`rounded-xl border p-5 ${
                                                plan.current
                                                    ? "border-purple-500/30 bg-purple-500/5"
                                                    : "border-white/6 bg-[var(--bg-card)]"
                                            }`}
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <h4 className="font-semibold text-[var(--text-primary)]">
                                                    {plan.name}
                                                </h4>
                                                {plan.current && (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-purple-500/30 bg-purple-500/15 text-[10px] text-purple-300"
                                                    >
                                                        Current
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="mb-3 text-2xl font-bold text-[var(--text-primary)]">
                                                {plan.price}
                                                <span className="text-sm font-normal text-[var(--text-muted)]">
                                                    {plan.period}
                                                </span>
                                            </p>
                                            <ul className="space-y-1.5">
                                                {plan.features.map((f) => (
                                                    <li
                                                        key={f}
                                                        className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"
                                                    >
                                                        <Check className="h-3 w-3 text-green-400" />
                                                        {f}
                                                    </li>
                                                ))}
                                            </ul>
                                            {!plan.current && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-4 w-full border-white/10 text-[var(--text-secondary)]"
                                                    disabled
                                                >
                                                    Coming Soon
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ── Notifications tab (local) ── */}
                        {activeTab === "notifications" && (
                            <div className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-5">
                                <h3 className="mb-4 text-sm font-medium text-[var(--text-primary)]">
                                    Notification Preferences
                                </h3>
                                <div className="space-y-4">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.key}
                                            className="flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="text-sm text-[var(--text-primary)]">
                                                    {n.label}
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    {n.description}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => toggleNotification(n.key)}
                                                className={`relative h-6 w-11 rounded-full transition-colors ${
                                                    n.enabled
                                                        ? "bg-purple-500"
                                                        : "bg-white/10"
                                                }`}
                                            >
                                                <span
                                                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                                                        n.enabled
                                                            ? "translate-x-5"
                                                            : "translate-x-0"
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Security tab (local) ── */}
                        {activeTab === "security" && (
                            <>
                                <div className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-5">
                                    <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                                        <KeyRound className="h-4 w-4" />
                                        Change Password
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-[var(--text-secondary)]">
                                                Current Password
                                            </label>
                                            <Input
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) =>
                                                    setCurrentPassword(e.target.value)
                                                }
                                                className="h-10 border-white/10 bg-[var(--bg-input)] text-sm text-[var(--text-primary)] focus:border-purple-500/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-[var(--text-secondary)]">
                                                New Password
                                            </label>
                                            <Input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) =>
                                                    setNewPassword(e.target.value)
                                                }
                                                className="h-10 border-white/10 bg-[var(--bg-input)] text-sm text-[var(--text-primary)] focus:border-purple-500/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-[var(--text-secondary)]">
                                                Confirm New Password
                                            </label>
                                            <Input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) =>
                                                    setConfirmPassword(e.target.value)
                                                }
                                                className="h-10 border-white/10 bg-[var(--bg-input)] text-sm text-[var(--text-primary)] focus:border-purple-500/50"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-5 flex justify-end">
                                        <Button
                                            disabled
                                            className="gap-1.5 bg-purple-600 text-white opacity-50"
                                        >
                                            <Shield className="h-4 w-4" />
                                            Update Password
                                        </Button>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-5">
                                    <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                                        <Settings2 className="h-4 w-4" />
                                        Two-Factor Authentication
                                    </h3>
                                    <p className="mb-3 text-xs text-[var(--text-muted)]">
                                        Add an extra layer of security to your account
                                    </p>
                                    <Button
                                        disabled
                                        variant="outline"
                                        size="sm"
                                        className="border-white/10 text-[var(--text-secondary)] opacity-50"
                                    >
                                        Enable 2FA — Coming Soon
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
