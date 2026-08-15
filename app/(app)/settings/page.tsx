// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
    User,
    Building2,
    CreditCard,
    Bell,
    Shield,
    Save,
    Upload,
    Check,
    Crown,
    Users,
    Palette,
    Globe,
    Key,
    Smartphone,
    LogOut,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/* ─── Constants ───────────────────────────────────────────── */

const TABS = [
    { key: "profile", label: "Profile", icon: User },
    { key: "workspace", label: "Workspace", icon: Building2 },
    { key: "billing", label: "Plan & Billing", icon: CreditCard },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "security", label: "Security", icon: Shield },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const PLANS = [
    {
        id: "free",
        name: "Free",
        price: 0,
        features: ["1 LinkedIn Account", "100 DB Leads/mo", "50 ICP Credits", "5 AI Posts/mo", "1 Campaign"],
        current: false,
    },
    {
        id: "solo",
        name: "Solo",
        price: 49,
        features: ["3 LinkedIn Accounts", "2K DB Leads/mo", "500 ICP Credits", "50 AI Posts/mo", "10 Campaigns"],
        current: true,
    },
    {
        id: "team",
        name: "Team",
        price: 149,
        features: ["10 LinkedIn Accounts", "10K DB Leads/mo", "2K ICP Credits", "Unlimited AI Posts", "Unlimited Campaigns"],
        current: false,
        popular: true,
    },
    {
        id: "agency",
        name: "Agency",
        price: 349,
        features: ["50 LinkedIn Accounts", "50K DB Leads/mo", "10K ICP Credits", "Unlimited AI Posts", "Unlimited Campaigns", "White-label"],
        current: false,
    },
];

interface NotificationSetting {
    id: string;
    label: string;
    description: string;
    email: boolean;
    push: boolean;
}

const NOTIFICATION_SETTINGS: NotificationSetting[] = [
    { id: "replies", label: "New Replies", description: "When a lead replies to your message", email: true, push: true },
    { id: "connections", label: "Connection Accepted", description: "When a connection request is accepted", email: true, push: false },
    { id: "campaigns", label: "Campaign Completed", description: "When a campaign finishes processing", email: true, push: true },
    { id: "inbound", label: "Inbound Triggers", description: "When an inbound automation triggers", email: false, push: true },
    { id: "billing", label: "Billing Alerts", description: "Payment confirmations and plan changes", email: true, push: false },
    { id: "security", label: "Security Alerts", description: "Login from new device or location", email: true, push: true },
];

/* ─── Component ───────────────────────────────────────────── */

/**
 * Settings page — Profile, Workspace, Billing, Notifications, Security.
 */
export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabKey>("profile");
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    /* Profile form state */
    const [fullName, setFullName] = useState("Said Borna");
    const [email, setEmail] = useState("said@saidborna.com");
    const [title, setTitle] = useState("CEO & Founder");
    const [timezone, setTimezone] = useState("Europe/Stockholm");

    /* Workspace state */
    const [workspaceName, setWorkspaceName] = useState("Personal Workspace");
    const [memberCount, setMemberCount] = useState(1);
    const [linkedinAccountCount, setLinkedinAccountCount] = useState(3);
    const [workspacePlan, setWorkspacePlan] = useState("solo");

    /* Notification state */
    const [notifications, setNotifications] = useState(NOTIFICATION_SETTINGS);

    /* ── Fetch profile + workspace from API ──────────── */
    useEffect(() => {
        async function load(): Promise<void> {
            try {
                const [profileRes, workspaceRes] = await Promise.all([
                    fetch("/api/settings/profile"),
                    fetch("/api/settings/workspace"),
                ]);
                if (profileRes.ok) {
                    const p = await profileRes.json() as {
                        id: string; email: string; fullName: string | null; avatarUrl: string | null;
                    };
                    if (p.fullName) setFullName(p.fullName);
                    if (p.email) setEmail(p.email);
                }
                if (workspaceRes.ok) {
                    const w = await workspaceRes.json() as {
                        id: string; name: string; plan: string; memberCount: number; linkedinAccountCount: number;
                    };
                    setWorkspaceName(w.name);
                    setMemberCount(w.memberCount);
                    setLinkedinAccountCount(w.linkedinAccountCount);
                    setWorkspacePlan(w.plan);
                }
            } catch {
                /* keep defaults */
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, []);

    async function handleSave(): Promise<void> {
        setSaved(true);
        try {
            await Promise.all([
                fetch("/api/settings/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fullName }),
                }),
                fetch("/api/settings/workspace", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: workspaceName }),
                }),
            ]);
            toast.success("Settings saved successfully");
        } catch {
            toast.error("Failed to save settings");
        } finally {
            setTimeout(() => setSaved(false), 2000);
        }
    }

    function toggleNotification(id: string, channel: "email" | "push"): void {
        setNotifications((prev) =>
            prev.map((n) =>
                n.id === id ? { ...n, [channel]: !n[channel] } : n,
            ),
        );
    }

    if (loading) {
        return <div className="flex h-64 items-center justify-center text-[var(--text-muted)]">Loading settings…</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[var(--text-primary)]">Settings</h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Manage your account, workspace, and preferences.
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    className="gap-2 bg-purple-500 text-white hover:from-purple-600 hover:to-purple-700"
                >
                    {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saved ? "Saved!" : "Save Changes"}
                </Button>
            </div>

            {/* Layout: sidebar tabs + content */}
            <div className="flex gap-6">
                {/* Tab sidebar */}
                <div className="w-52 shrink-0 space-y-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${activeTab === tab.key
                                ? "bg-purple-500/15 font-medium text-purple-300"
                                : "text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-secondary)]"
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content area */}
                <div className="flex-1 rounded-xl border border-white/6 bg-[var(--bg-card)] p-6">
                    {/* ── Profile ────────── */}
                    {activeTab === "profile" && (
                        <div className="space-y-6">
                            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Profile Information</h2>

                            {/* Avatar */}
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20 text-xl font-bold text-purple-300">
                                    {fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "??"}
                                </div>
                                <div>
                                    <Button variant="outline" size="sm" className="gap-1.5 border-white/10 text-[var(--text-secondary)]">
                                        <Upload className="h-3.5 w-3.5" />
                                        Upload Photo
                                    </Button>
                                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">JPG, PNG, max 2MB</p>
                                </div>
                            </div>

                            {/* Form fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Full Name</label>
                                    <Input
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="border-white/10 bg-[var(--bg-input)] text-[var(--text-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Email</label>
                                    <Input
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="border-white/10 bg-[var(--bg-input)] text-[var(--text-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Job Title</label>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="border-white/10 bg-[var(--bg-input)] text-[var(--text-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Timezone</label>
                                    <Input
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className="border-white/10 bg-[var(--bg-input)] text-[var(--text-primary)]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Workspace ────────── */}
                    {activeTab === "workspace" && (
                        <div className="space-y-6">
                            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Workspace Settings</h2>

                            {/* Summary cards */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="rounded-lg border border-white/6 bg-white/[0.02] p-4 text-center">
                                    <Building2 className="mx-auto mb-2 h-5 w-5 text-purple-400" />
                                    <p className="text-lg font-bold text-[var(--text-primary)]">1</p>
                                    <p className="text-xs text-[var(--text-muted)]">Total Workspaces</p>
                                </div>
                                <div className="rounded-lg border border-white/6 bg-white/[0.02] p-4 text-center">
                                    <Globe className="mx-auto mb-2 h-5 w-5 text-blue-400" />
                                    <p className="text-lg font-bold text-[var(--text-primary)]">{linkedinAccountCount}</p>
                                    <p className="text-xs text-[var(--text-muted)]">LinkedIn Accounts</p>
                                </div>
                                <div className="rounded-lg border border-white/6 bg-white/[0.02] p-4 text-center">
                                    <Users className="mx-auto mb-2 h-5 w-5 text-green-400" />
                                    <p className="text-lg font-bold text-[var(--text-primary)]">{memberCount}</p>
                                    <p className="text-xs text-[var(--text-muted)]">Team Members</p>
                                </div>
                            </div>

                            {/* Workspace name */}
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Workspace Name</label>
                                <Input
                                    value={workspaceName}
                                    onChange={(e) => setWorkspaceName(e.target.value)}
                                    className="max-w-md border-white/10 bg-[var(--bg-input)] text-[var(--text-primary)]"
                                />
                            </div>

                            {/* Workspace card */}
                            <div className="rounded-lg border border-white/6 bg-white/[0.02] p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/15">
                                            <Building2 className="h-5 w-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-[var(--text-primary)]">{workspaceName}</p>
                                                <Badge variant="outline" className="border-green-500/30 bg-green-500/15 text-green-300 text-[10px]">
                                                    ACTIVE
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-[var(--text-muted)]">{memberCount} member{memberCount !== 1 ? "s" : ""} · {workspacePlan} plan</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs">
                                        {linkedinAccountCount} Sender{linkedinAccountCount !== 1 ? "s" : ""}
                                    </Badge>
                                </div>
                            </div>

                            {/* White-label branding */}
                            <div className="rounded-lg border border-white/6 bg-white/[0.02] p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Palette className="h-4 w-4 text-amber-400" />
                                    <h3 className="text-sm font-medium text-[var(--text-primary)]">Custom Branding</h3>
                                    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px]">
                                        Agency Plan
                                    </Badge>
                                </div>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Upload your logo and customize branding for white-label client dashboards. Available on Agency plan.
                                </p>
                                <Button variant="outline" size="sm" className="mt-3 gap-1.5 border-white/10 text-[var(--text-secondary)]">
                                    <Upload className="h-3.5 w-3.5" />
                                    Upload Logo
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ── Billing ────────── */}
                    {activeTab === "billing" && (
                        <div className="space-y-6">
                            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Plan & Billing</h2>

                            {/* Current plan */}
                            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Crown className="h-5 w-5 text-purple-400" />
                                        <div>
                                            <p className="text-sm font-medium text-[var(--text-primary)]">{workspacePlan.charAt(0).toUpperCase() + workspacePlan.slice(1)} Plan</p>
                                            <p className="text-xs text-[var(--text-secondary)]">${PLANS.find((p) => p.id === workspacePlan)?.price ?? 0}/month</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="border-green-500/30 bg-green-500/15 text-green-300">
                                        Active
                                    </Badge>
                                </div>
                            </div>

                            {/* Plan cards */}
                            <div className="grid grid-cols-4 gap-4">
                                {PLANS.map((plan) => {
                                    const isCurrent = plan.id === workspacePlan;
                                    return (
                                    <div
                                        key={plan.id}
                                        className={`rounded-xl border p-5 transition ${isCurrent
                                            ? "border-purple-500/40 bg-purple-500/5"
                                            : plan.popular
                                                ? "border-purple-500/20 bg-[var(--bg-card)]"
                                                : "border-white/6 bg-[var(--bg-card)]"
                                            }`}
                                    >
                                        {plan.popular && (
                                            <Badge className="mb-3 bg-purple-500 text-[10px] text-white">
                                                Most Popular
                                            </Badge>
                                        )}
                                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{plan.name}</h3>
                                        <div className="mt-2 flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-[var(--text-primary)]">${plan.price}</span>
                                            <span className="text-xs text-[var(--text-muted)]">/mo</span>
                                        </div>
                                        <ul className="mt-4 space-y-2">
                                            {plan.features.map((feature) => (
                                                <li key={feature} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                                    <Check className="h-3 w-3 text-green-400" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        <Button
                                            variant={isCurrent ? "outline" : "default"}
                                            size="sm"
                                            className={`mt-4 w-full ${isCurrent
                                                ? "border-purple-500/30 text-purple-300"
                                                : "bg-purple-500 text-white"
                                                }`}
                                            disabled={isCurrent}
                                        >
                                            {isCurrent ? "Current Plan" : "Upgrade"}
                                        </Button>
                                    </div>
                                    );
                                })}
                            </div>

                            {/* Payment method */}
                            <div className="rounded-lg border border-white/6 bg-white/[0.02] p-4">
                                <h3 className="mb-3 text-sm font-medium text-[var(--text-primary)]">Payment Method</h3>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="h-5 w-5 text-[var(--text-secondary)]" />
                                        <div>
                                            <p className="text-sm text-[var(--text-primary)]">Visa ending in 4242</p>
                                            <p className="text-xs text-[var(--text-muted)]">Expires 12/2027</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" className="border-white/10 text-[var(--text-secondary)]">
                                        Update
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Notifications ────────── */}
                    {activeTab === "notifications" && (
                        <div className="space-y-6">
                            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Notification Preferences</h2>

                            <div className="rounded-xl border border-white/6 bg-white/[0.02]">
                                {/* Header row */}
                                <div className="flex items-center border-b border-white/6 px-5 py-3">
                                    <span className="flex-1 text-xs font-medium text-[var(--text-secondary)]">Event</span>
                                    <span className="w-20 text-center text-xs font-medium text-[var(--text-secondary)]">Email</span>
                                    <span className="w-20 text-center text-xs font-medium text-[var(--text-secondary)]">Push</span>
                                </div>

                                <div className="divide-y divide-white/4">
                                    {notifications.map((notif) => (
                                        <div key={notif.id} className="flex items-center px-5 py-3.5">
                                            <div className="flex-1">
                                                <p className="text-sm text-[var(--text-primary)]">{notif.label}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{notif.description}</p>
                                            </div>
                                            <div className="w-20 text-center">
                                                <button
                                                    onClick={() => toggleNotification(notif.id, "email")}
                                                    className={`inline-flex h-5 w-9 items-center rounded-full transition ${notif.email ? "bg-purple-500" : "bg-white/10"}`}
                                                >
                                                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${notif.email ? "translate-x-4" : "translate-x-0.5"}`} />
                                                </button>
                                            </div>
                                            <div className="w-20 text-center">
                                                <button
                                                    onClick={() => toggleNotification(notif.id, "push")}
                                                    className={`inline-flex h-5 w-9 items-center rounded-full transition ${notif.push ? "bg-purple-500" : "bg-white/10"}`}
                                                >
                                                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${notif.push ? "translate-x-4" : "translate-x-0.5"}`} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Security ────────── */}
                    {activeTab === "security" && (
                        <div className="space-y-6">
                            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Security</h2>

                            {/* Password */}
                            <div className="rounded-lg border border-white/6 bg-white/[0.02] p-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <Key className="h-4 w-4 text-[var(--text-secondary)]" />
                                    <h3 className="text-sm font-medium text-[var(--text-primary)]">Change Password</h3>
                                </div>
                                <div className="space-y-3 max-w-md">
                                    <div>
                                        <label className="mb-1 block text-xs text-[var(--text-secondary)]">Current Password</label>
                                        <Input type="password" className="border-white/10 bg-[var(--bg-input)] text-[var(--text-primary)]" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs text-[var(--text-secondary)]">New Password</label>
                                        <Input type="password" className="border-white/10 bg-[var(--bg-input)] text-[var(--text-primary)]" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs text-[var(--text-secondary)]">Confirm New Password</label>
                                        <Input type="password" className="border-white/10 bg-[var(--bg-input)] text-[var(--text-primary)]" />
                                    </div>
                                    <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                                        Update Password
                                    </Button>
                                </div>
                            </div>

                            {/* Two-factor */}
                            <div className="rounded-lg border border-white/6 bg-white/[0.02] p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="h-4 w-4 text-[var(--text-secondary)]" />
                                        <div>
                                            <h3 className="text-sm font-medium text-[var(--text-primary)]">Two-Factor Authentication</h3>
                                            <p className="text-xs text-[var(--text-muted)]">Add an extra layer of security to your account</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs">
                                        Not Enabled
                                    </Badge>
                                </div>
                                <Button variant="outline" size="sm" className="mt-3 border-white/10 text-[var(--text-secondary)]">
                                    Enable 2FA
                                </Button>
                            </div>

                            {/* Active sessions */}
                            <div className="rounded-lg border border-white/6 bg-white/[0.02] p-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <Globe className="h-4 w-4 text-[var(--text-secondary)]" />
                                    <h3 className="text-sm font-medium text-[var(--text-primary)]">Active Sessions</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-[var(--text-primary)]">Chrome on macOS</p>
                                            <p className="text-xs text-[var(--text-muted)]">Stockholm, Sweden · Current session</p>
                                        </div>
                                        <Badge variant="outline" className="border-green-500/30 bg-green-500/15 text-green-300 text-xs">
                                            Current
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-[var(--text-primary)]">Safari on iPhone</p>
                                            <p className="text-xs text-[var(--text-muted)]">Stockholm, Sweden · 2 days ago</p>
                                        </div>
                                        <button className="rounded p-1.5 text-[var(--text-muted)] hover:bg-white/5 hover:text-red-400">
                                            <LogOut className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Danger zone */}
                            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                                <h3 className="mb-2 text-sm font-medium text-red-400">Danger Zone</h3>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Permanently delete your account and all associated data. This action cannot be undone.
                                </p>
                                <Button variant="outline" size="sm" className="mt-3 gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10">
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete Account
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
