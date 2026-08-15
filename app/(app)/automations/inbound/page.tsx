// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ArrowRight,
    CheckCircle2,
    Clock,
    Loader2,
    MessageSquare,
    Pause,
    Play,
    Plus,
    Settings2,
    Trash2,
    Users,
    XCircle,
    Zap,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */

interface LinkedinAccountInfo {
    linkedinAccount: {
        id: string;
        accountName: string;
        status: string;
        avatarUrl?: string | null;
    };
}

interface InboundAutomation {
    id: string;
    name: string;
    postUrl: string | null;
    status: string;
    triggerKeywords: string[];
    autoReplyComment: string | null;
    autoDmMessage: string | null;
    triggersCount: number;
    createdAt: string;
    accounts: LinkedinAccountInfo[];
}

interface LinkedinAccount {
    id: string;
    accountName: string;
    status: string;
}

type ViewMode = "list" | "wizard" | "dashboard";

/* ─── Wizard types ──────────────────────────────────── */

type WizardStepKey = "details" | "keywords" | "message" | "senders" | "review";

const WIZARD_STEPS: { key: WizardStepKey; label: string; number: number }[] = [
    { key: "details", label: "Details", number: 1 },
    { key: "keywords", label: "Action Words", number: 2 },
    { key: "message", label: "Message", number: 3 },
    { key: "senders", label: "Senders", number: 4 },
    { key: "review", label: "Review", number: 5 },
];

const DEFAULT_COMMENT_REPLIES = ["Sent it", "Done", "You got it", "Check your DMs"];

const STATUS_STYLES: Record<string, string> = {
    active:
        "border-green-500/30 bg-green-500/15 text-green-300",
    paused:
        "border-amber-500/30 bg-amber-500/15 text-amber-300",
};

/* ─── Component ─────────────────────────────────────── */

/**
 * Inbound Automations page.
 * List, create (5-step wizard), or view dashboard for an automation.
 * All data fetched from real API endpoints.
 */
export default function InboundAutomationsPage() {
    const [view, setView] = useState<ViewMode>("list");
    const [automations, setAutomations] = useState<InboundAutomation[]>([]);
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<LinkedinAccount[]>([]);

    // Wizard state
    const [wizardStep, setWizardStep] = useState<WizardStepKey>("details");
    const [wizardName, setWizardName] = useState("");
    const [wizardPostUrl, setWizardPostUrl] = useState("");
    const [wizardKeywords, setWizardKeywords] = useState<string[]>([]);
    const [keywordInput, setKeywordInput] = useState("");
    const [wizardCommentReplies, setWizardCommentReplies] = useState<string[]>([
        ...DEFAULT_COMMENT_REPLIES,
    ]);
    const [wizardDmMessage, setWizardDmMessage] = useState("");
    const [wizardSelectedSenders, setWizardSelectedSenders] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    // Dashboard state
    const [dashboardAutomation, setDashboardAutomation] =
        useState<InboundAutomation | null>(null);

    /* ── Fetch automations + accounts ── */

    const fetchAutomations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/automations?pageSize=50");
            if (!res.ok) throw new Error("Failed to load automations");
            const json = await res.json();
            setAutomations(json.data?.data ?? []);
        } catch {
            toast.error("Failed to load automations");
            setAutomations([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAccounts = useCallback(async () => {
        try {
            const res = await fetch("/api/linkedin-accounts");
            if (!res.ok) return;
            const json = await res.json();
            setAccounts(json.data?.data ?? []);
        } catch {
            /* silent */
        }
    }, []);

    useEffect(() => {
        fetchAutomations();
        fetchAccounts();
    }, [fetchAutomations, fetchAccounts]);

    /* ── CRUD handlers ────────────── */

    async function toggleStatus(automation: InboundAutomation): Promise<void> {
        const newStatus = automation.status === "active" ? "paused" : "active";
        try {
            const res = await fetch(`/api/automations/${automation.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success(`Automation ${newStatus === "active" ? "activated" : "paused"}`);
            await fetchAutomations();
        } catch {
            toast.error("Failed to update status");
        }
    }

    async function deleteAutomation(id: string): Promise<void> {
        try {
            const res = await fetch(`/api/automations/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed");
            toast.success("Automation deleted");
            await fetchAutomations();
        } catch {
            toast.error("Failed to delete automation");
        }
    }

    async function duplicateAutomation(automation: InboundAutomation): Promise<void> {
        try {
            const res = await fetch("/api/automations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: `${automation.name} (copy)`,
                    postUrl: automation.postUrl || undefined,
                    triggerKeywords: automation.triggerKeywords,
                    autoReplyComment: automation.autoReplyComment || undefined,
                    autoDmMessage: automation.autoDmMessage || undefined,
                    linkedinAccountIds: automation.accounts.map(
                        (a) => a.linkedinAccount.id,
                    ),
                }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Automation duplicated");
            await fetchAutomations();
        } catch {
            toast.error("Failed to duplicate automation");
        }
    }

    /* ── Wizard handlers ──────────── */

    function resetWizard(): void {
        setWizardStep("details");
        setWizardName("");
        setWizardPostUrl("");
        setWizardKeywords([]);
        setKeywordInput("");
        setWizardCommentReplies([...DEFAULT_COMMENT_REPLIES]);
        setWizardDmMessage("");
        setWizardSelectedSenders([]);
    }

    function startCreate(): void {
        resetWizard();
        setView("wizard");
    }

    function addKeyword(): void {
        const word = keywordInput.trim();
        if (word && !wizardKeywords.includes(word)) {
            setWizardKeywords([...wizardKeywords, word]);
        }
        setKeywordInput("");
    }

    function removeKeyword(kw: string): void {
        setWizardKeywords(wizardKeywords.filter((k) => k !== kw));
    }

    function removeCommentReply(idx: number): void {
        setWizardCommentReplies(wizardCommentReplies.filter((_, i) => i !== idx));
    }

    function toggleSender(id: string): void {
        setWizardSelectedSenders((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
        );
    }

    async function submitAutomation(): Promise<void> {
        if (!wizardName.trim()) {
            toast.error("Please provide a name");
            return;
        }
        setSaving(true);
        try {
            const body: Record<string, unknown> = {
                name: wizardName.trim(),
                triggerKeywords: wizardKeywords,
                autoDmMessage: wizardDmMessage.trim() || undefined,
                autoReplyComment: wizardCommentReplies.join("|") || undefined,
            };
            if (wizardPostUrl.trim()) {
                body.postUrl = wizardPostUrl.trim();
            }
            if (wizardSelectedSenders.length > 0) {
                body.linkedinAccountIds = wizardSelectedSenders;
            }
            const res = await fetch("/api/automations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed");
            }
            toast.success("Automation created");
            setView("list");
            await fetchAutomations();
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to create automation";
            toast.error(message);
        } finally {
            setSaving(false);
        }
    }

    function openDashboard(automation: InboundAutomation): void {
        setDashboardAutomation(automation);
        setView("dashboard");
    }

    const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.key === wizardStep);

    function nextStep(): void {
        if (currentStepIndex < WIZARD_STEPS.length - 1) {
            setWizardStep(WIZARD_STEPS[currentStepIndex + 1].key);
        }
    }

    function prevStep(): void {
        if (currentStepIndex > 0) {
            setWizardStep(WIZARD_STEPS[currentStepIndex - 1].key);
        }
    }

    /* ─── List view ──────────────── */

    if (view === "list") {
        return (
            <div className="flex h-full flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-white/6 px-6 py-4">
                    <div>
                        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                            Inbound Automations
                        </h1>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Automate inbound workflows from LinkedIn post engagement
                        </p>
                    </div>
                    <Button
                        onClick={startCreate}
                        className="gap-1.5 bg-purple-600 text-white hover:bg-purple-500"
                    >
                        <Plus className="h-4 w-4" />
                        New Automation
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-20 animate-pulse rounded-xl bg-white/5"
                                />
                            ))}
                        </div>
                    ) : automations.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center text-center">
                            <Zap className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
                            <p className="text-sm text-[var(--text-secondary)]">
                                No automations yet
                            </p>
                            <p className="mb-4 text-xs text-[var(--text-muted)]">
                                Create one to automate inbound engagement
                            </p>
                            <Button
                                onClick={startCreate}
                                size="sm"
                                className="gap-1.5 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Create Automation
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-white/6">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/6 bg-white/3 text-left text-xs font-medium text-[var(--text-secondary)]">
                                        <th className="px-4 py-3">Automation Name</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Keywords</th>
                                        <th className="px-4 py-3">Triggers</th>
                                        <th className="px-4 py-3">Created</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {automations.map((auto) => (
                                        <tr
                                            key={auto.id}
                                            className="border-b border-white/4 transition-colors hover:bg-white/3"
                                        >
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => openDashboard(auto)}
                                                    className="font-medium text-[var(--text-primary)] hover:text-purple-300"
                                                >
                                                    {auto.name}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        STATUS_STYLES[auto.status] ??
                                                        "border-white/10 text-[var(--text-muted)]"
                                                    }
                                                >
                                                    {auto.status.charAt(0).toUpperCase() +
                                                        auto.status.slice(1)}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {auto.triggerKeywords
                                                        .slice(0, 3)
                                                        .map((kw) => (
                                                            <span
                                                                key={kw}
                                                                className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] text-purple-300"
                                                            >
                                                                {kw}
                                                            </span>
                                                        ))}
                                                    {auto.triggerKeywords.length > 3 && (
                                                        <span className="text-[10px] text-[var(--text-muted)]">
                                                            +
                                                            {auto.triggerKeywords.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-[var(--text-primary)]">
                                                {auto.triggersCount}
                                            </td>
                                            <td className="px-4 py-3 text-[var(--text-muted)]">
                                                {new Date(
                                                    auto.createdAt,
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleStatus(auto)}
                                                        className="h-7 w-7 p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                                        title={
                                                            auto.status === "active"
                                                                ? "Pause"
                                                                : "Activate"
                                                        }
                                                    >
                                                        {auto.status === "active" ? (
                                                            <Pause className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <Play className="h-3.5 w-3.5" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            duplicateAutomation(auto)
                                                        }
                                                        className="h-7 px-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                                    >
                                                        Duplicate
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            deleteAutomation(auto.id)
                                                        }
                                                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /* ─── Dashboard view ─────────── */

    if (view === "dashboard" && dashboardAutomation) {
        const auto = dashboardAutomation;
        return (
            <div className="flex h-full flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-white/6 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setView("list")}
                            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                            ← Back
                        </Button>
                        <div>
                            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                                {auto.name}
                            </h1>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant="outline"
                                    className={
                                        STATUS_STYLES[auto.status] ??
                                        "border-white/10 text-[var(--text-muted)]"
                                    }
                                >
                                    {auto.status.charAt(0).toUpperCase() +
                                        auto.status.slice(1)}
                                </Badge>
                                <span className="text-xs text-[var(--text-muted)]">
                                    Created {new Date(auto.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleStatus(auto)}
                            className="gap-1.5 border-white/10 text-[var(--text-secondary)]"
                        >
                            {auto.status === "active" ? (
                                <>
                                    <Pause className="h-3.5 w-3.5" /> Pause
                                </>
                            ) : (
                                <>
                                    <Play className="h-3.5 w-3.5" /> Activate
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* KPI cards */}
                    <div className="mb-6 grid grid-cols-4 gap-4">
                        {[
                            {
                                label: "Total Triggers",
                                value: auto.triggersCount,
                                color: "border-purple-500/30",
                                icon: Zap,
                            },
                            {
                                label: "Status",
                                value: auto.status === "active" ? "Monitoring" : "Paused",
                                color: "border-green-500/30",
                                icon: Settings2,
                            },
                            {
                                label: "Senders",
                                value: auto.accounts.length,
                                color: "border-blue-500/30",
                                icon: Users,
                            },
                            {
                                label: "Keywords",
                                value: auto.triggerKeywords.length,
                                color: "border-amber-500/30",
                                icon: MessageSquare,
                            },
                        ].map((kpi) => (
                            <div
                                key={kpi.label}
                                className={`rounded-xl border-t-2 ${kpi.color} border border-white/6 bg-[var(--bg-card)] p-4`}
                            >
                                <div className="mb-1 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                                    <kpi.icon className="h-3.5 w-3.5" />
                                    {kpi.label}
                                </div>
                                <p className="text-xl font-semibold text-[var(--text-primary)]">
                                    {kpi.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Post info + keywords */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-4">
                            <h3 className="mb-3 text-sm font-medium text-[var(--text-primary)]">
                                Post URL
                            </h3>
                            {auto.postUrl ? (
                                <a
                                    href={auto.postUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-400 underline"
                                >
                                    {auto.postUrl}
                                </a>
                            ) : (
                                <p className="text-sm text-[var(--text-muted)]">
                                    No post URL set
                                </p>
                            )}

                            <h3 className="mb-2 mt-4 text-sm font-medium text-[var(--text-primary)]">
                                DM Message
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {auto.autoDmMessage || "No DM message configured"}
                            </p>

                            <h3 className="mb-2 mt-4 text-sm font-medium text-[var(--text-primary)]">
                                Comment Replies
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {auto.autoReplyComment || "No auto replies configured"}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-4">
                                <h3 className="mb-3 text-sm font-medium text-[var(--text-primary)]">
                                    Trigger Keywords
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {auto.triggerKeywords.length > 0 ? (
                                        auto.triggerKeywords.map((kw) => (
                                            <Badge
                                                key={kw}
                                                variant="outline"
                                                className="border-purple-500/20 bg-purple-500/10 text-purple-300"
                                            >
                                                {kw}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-[var(--text-muted)]">
                                            No keywords set
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-4">
                                <h3 className="mb-3 text-sm font-medium text-[var(--text-primary)]">
                                    Connected Senders
                                </h3>
                                {auto.accounts.length > 0 ? (
                                    <div className="space-y-2">
                                        {auto.accounts.map((acc) => (
                                            <div
                                                key={acc.linkedinAccount.id}
                                                className="flex items-center gap-2"
                                            >
                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600/30 to-blue-800/30 text-xs font-bold text-blue-300">
                                                    {acc.linkedinAccount.accountName
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <span className="text-sm text-[var(--text-primary)]">
                                                    {acc.linkedinAccount.accountName}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-[var(--text-muted)]">
                                        No senders assigned
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Wizard view ────────────── */

    return (
        <div className="flex h-full flex-1 flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-white/6 px-6 py-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setView("list")}
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                        ← Back
                    </Button>
                    <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                        New Inbound Automation
                    </h1>
                </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 border-b border-white/6 px-6 py-3">
                {WIZARD_STEPS.map((step, i) => (
                    <div key={step.key} className="flex items-center gap-2">
                        <button
                            onClick={() => setWizardStep(step.key)}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                i <= currentStepIndex
                                    ? "bg-purple-500/20 text-purple-300"
                                    : "bg-white/5 text-[var(--text-muted)]"
                            }`}
                        >
                            <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                    i < currentStepIndex
                                        ? "bg-green-500/30 text-green-300"
                                        : i === currentStepIndex
                                          ? "bg-purple-500/30 text-purple-300"
                                          : "bg-white/10 text-[var(--text-muted)]"
                                }`}
                            >
                                {i < currentStepIndex ? "✓" : step.number}
                            </span>
                            {step.label}
                        </button>
                        {i < WIZARD_STEPS.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-[var(--text-muted)]" />
                        )}
                    </div>
                ))}
            </div>

            {/* Step content */}
            <div className="flex flex-1 items-start justify-center overflow-y-auto p-6">
                <div className="w-full max-w-xl space-y-4">
                    {/* Step 1: Details */}
                    {wizardStep === "details" && (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[var(--text-secondary)]">
                                    Automation Name
                                </label>
                                <Input
                                    placeholder="e.g. LinkedIn Post Engagement"
                                    value={wizardName}
                                    onChange={(e) => setWizardName(e.target.value)}
                                    className="h-10 border-white/10 bg-[var(--bg-input)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[var(--text-secondary)]">
                                    LinkedIn Post URL
                                </label>
                                <Input
                                    placeholder="https://linkedin.com/posts/..."
                                    value={wizardPostUrl}
                                    onChange={(e) => setWizardPostUrl(e.target.value)}
                                    className="h-10 border-white/10 bg-[var(--bg-input)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50"
                                />
                                <p className="text-xs text-[var(--text-muted)]">
                                    The LinkedIn post that will trigger this automation when
                                    people comment with the action words.
                                </p>
                            </div>
                        </>
                    )}

                    {/* Step 2: Keywords */}
                    {wizardStep === "keywords" && (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[var(--text-secondary)]">
                                    Action Words
                                </label>
                                <p className="text-xs text-[var(--text-muted)]">
                                    When someone comments with these words, the automation
                                    triggers.
                                </p>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder='e.g. "interested", "send"'
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addKeyword();
                                            }
                                        }}
                                        className="h-10 border-white/10 bg-[var(--bg-input)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50"
                                    />
                                    <Button
                                        onClick={addKeyword}
                                        variant="outline"
                                        className="border-white/10"
                                    >
                                        Add
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {wizardKeywords.map((kw) => (
                                    <Badge
                                        key={kw}
                                        variant="outline"
                                        className="gap-1 border-purple-500/20 bg-purple-500/10 text-purple-300"
                                    >
                                        {kw}
                                        <button
                                            onClick={() => removeKeyword(kw)}
                                            className="ml-1 text-purple-400 hover:text-purple-200"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Step 3: Message */}
                    {wizardStep === "message" && (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[var(--text-secondary)]">
                                    Direct Message
                                </label>
                                <textarea
                                    placeholder="Message to send when triggered..."
                                    value={wizardDmMessage}
                                    onChange={(e) => setWizardDmMessage(e.target.value)}
                                    rows={4}
                                    className="w-full resize-none rounded-lg border border-white/10 bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[var(--text-secondary)]">
                                    Comment Replies
                                </label>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Random replies posted to the commenter. Remove or add as
                                    needed.
                                </p>
                                <div className="space-y-2">
                                    {wizardCommentReplies.map((reply, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2 rounded-lg border border-white/6 bg-white/3 px-3 py-2 text-sm text-[var(--text-primary)]"
                                        >
                                            <span className="flex-1">{reply}</span>
                                            <button
                                                onClick={() => removeCommentReply(i)}
                                                className="text-[var(--text-muted)] hover:text-red-400"
                                            >
                                                <XCircle className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Step 4: Senders */}
                    {wizardStep === "senders" && (
                        <>
                            <label className="text-xs font-medium text-[var(--text-secondary)]">
                                Select LinkedIn Senders
                            </label>
                            {accounts.length === 0 ? (
                                <p className="text-sm text-[var(--text-muted)]">
                                    No LinkedIn accounts connected. Add one in LinkedIn
                                    Accounts.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {accounts.map((acct) => (
                                        <button
                                            key={acct.id}
                                            onClick={() => toggleSender(acct.id)}
                                            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                                                wizardSelectedSenders.includes(acct.id)
                                                    ? "border-purple-500/30 bg-purple-500/10"
                                                    : "border-white/6 bg-white/3 hover:border-white/10"
                                            }`}
                                        >
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600/30 to-blue-800/30 text-xs font-bold text-blue-300">
                                                {acct.accountName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-[var(--text-primary)]">
                                                    {acct.accountName}
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    {acct.status}
                                                </p>
                                            </div>
                                            {wizardSelectedSenders.includes(acct.id) && (
                                                <CheckCircle2 className="h-4 w-4 text-purple-400" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Step 5: Review */}
                    {wizardStep === "review" && (
                        <div className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-5 space-y-4">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                                Review Automation
                            </h3>

                            <div>
                                <p className="text-xs text-[var(--text-secondary)]">Name</p>
                                <p className="text-sm text-[var(--text-primary)]">
                                    {wizardName || "—"}
                                </p>
                            </div>

                            {wizardPostUrl && (
                                <div>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        Post URL
                                    </p>
                                    <p className="text-sm text-blue-400">{wizardPostUrl}</p>
                                </div>
                            )}

                            <div>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    Keywords
                                </p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {wizardKeywords.length > 0 ? (
                                        wizardKeywords.map((kw) => (
                                            <Badge
                                                key={kw}
                                                variant="outline"
                                                className="border-purple-500/20 bg-purple-500/10 text-purple-300"
                                            >
                                                {kw}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-[var(--text-muted)]">
                                            None
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    DM Message
                                </p>
                                <p className="text-sm text-[var(--text-primary)]">
                                    {wizardDmMessage || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    Comment Replies
                                </p>
                                <p className="text-sm text-[var(--text-primary)]">
                                    {wizardCommentReplies.join(", ") || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-[var(--text-secondary)]">
                                    Senders
                                </p>
                                <p className="text-sm text-[var(--text-primary)]">
                                    {wizardSelectedSenders.length > 0
                                        ? `${wizardSelectedSenders.length} account${wizardSelectedSenders.length > 1 ? "s" : ""} selected`
                                        : "None"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation buttons */}
                    <div className="flex items-center justify-between pt-4">
                        <Button
                            variant="ghost"
                            onClick={prevStep}
                            disabled={currentStepIndex === 0}
                            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30"
                        >
                            Previous
                        </Button>

                        {wizardStep === "review" ? (
                            <Button
                                onClick={submitAutomation}
                                disabled={saving}
                                className="gap-1.5 bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Create Automation
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button
                                onClick={nextStep}
                                className="gap-1.5 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                            >
                                Next
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
