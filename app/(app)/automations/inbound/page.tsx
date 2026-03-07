// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useState } from "react";
import {
    Zap,
    Plus,
    Play,
    Pause,
    Trash2,
    Copy,
    BarChart3,
    MessageSquare,
    Users,
    CheckCircle2,
    AlertCircle,
    Clock,
    ArrowLeft,
    ArrowRight,
    X,
    RefreshCw,
    Eye,
    ExternalLink,
    Tag,
    Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/* ─── Constants ───────────────────────────────────────────── */

const WIZARD_STEPS = [
    { key: "details", label: "Details", icon: Eye },
    { key: "keywords", label: "Action Words", icon: Tag },
    { key: "message", label: "Message", icon: MessageSquare },
    { key: "senders", label: "Senders", icon: Users },
    { key: "review", label: "Review", icon: CheckCircle2 },
] as const;

type WizardStepKey = (typeof WIZARD_STEPS)[number]["key"];

const DEFAULT_COMMENT_REPLIES = [
    "Sent it!",
    "Done ✅",
    "You got it!",
    "Check your DMs 📩",
    "Just sent it over!",
];

interface InboundAutomation {
    id: string;
    name: string;
    postUrl: string;
    status: "active" | "paused";
    triggerKeywords: string[];
    commentReplies: string[];
    dmMessage: string;
    senderIds: string[];
    completed: number;
    processing: number;
    failed: number;
    createdAt: string;
}

const MOCK_SENDERS = [
    { id: "s1", name: "Said Borna", title: "CEO & Founder", avatar: "SB" },
    { id: "s2", name: "Nolan Vance", title: "CEO & Technoking", avatar: "EM" },
    { id: "s3", name: "Ezra Kaplan", title: "CEO", avatar: "SA" },
];

const MOCK_AUTOMATIONS: InboundAutomation[] = [
    {
        id: "auto-1",
        name: "Lead Magnet — LinkedIn Playbook",
        postUrl: "https://www.linkedin.com/posts/saidborna_linkedin-playbook-123",
        status: "active",
        triggerKeywords: ["playbook", "guide", "send", "interested", "want"],
        commentReplies: ["Sent it!", "Done ✅", "Check your DMs 📩"],
        dmMessage: "Hey {firstName}! Here's the LinkedIn Playbook you requested: https://example.com/playbook\n\nLet me know if you have any questions!",
        senderIds: ["s1", "s2"],
        completed: 142,
        processing: 3,
        failed: 2,
        createdAt: "2026-02-28",
    },
    {
        id: "auto-2",
        name: "Free Audit — Agency Owners",
        postUrl: "https://www.linkedin.com/posts/saidborna_free-audit-456",
        status: "active",
        triggerKeywords: ["audit", "free", "yes", "me", "interested"],
        commentReplies: ["You got it!", "Just sent it over!", "Done ✅"],
        dmMessage: "Hi {firstName}! Thanks for your interest in our free audit.\n\nI'd love to learn more about your agency. Can we book a quick 15-min call this week?",
        senderIds: ["s1"],
        completed: 87,
        processing: 1,
        failed: 0,
        createdAt: "2026-03-01",
    },
    {
        id: "auto-3",
        name: "Content Calendar Template",
        postUrl: "https://www.linkedin.com/posts/saidborna_content-calendar-789",
        status: "paused",
        triggerKeywords: ["template", "calendar", "send", "please"],
        commentReplies: ["Sent it!", "Check your DMs 📩"],
        dmMessage: "Hey {firstName}! Here's the content calendar template: https://example.com/calendar\n\nHope it helps!",
        senderIds: ["s1", "s3"],
        completed: 56,
        processing: 0,
        failed: 1,
        createdAt: "2026-03-03",
    },
];

/* ─── Status badge styles ─────────────────────────────────── */

const STATUS_STYLES: Record<string, string> = {
    active: "border-green-500/30 bg-green-500/15 text-green-300",
    paused: "border-amber-500/30 bg-amber-500/15 text-amber-300",
};

/* ─── Component ───────────────────────────────────────────── */

type ViewMode = "list" | "wizard" | "dashboard";

/**
 * Inbound Automations page — create and manage automated LinkedIn workflows.
 * Features: automation list, 5-step creation wizard, per-automation dashboard.
 */
export default function InboundAutomationsPage() {
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [automations, setAutomations] = useState<InboundAutomation[]>(MOCK_AUTOMATIONS);
    const [selectedAutomation, setSelectedAutomation] = useState<InboundAutomation | null>(null);

    /* wizard state */
    const [wizardStep, setWizardStep] = useState(0);
    const [wizardName, setWizardName] = useState("");
    const [wizardPostUrl, setWizardPostUrl] = useState("");
    const [wizardKeywords, setWizardKeywords] = useState<string[]>([]);
    const [keywordInput, setKeywordInput] = useState("");
    const [wizardCommentReplies, setWizardCommentReplies] = useState<string[]>(DEFAULT_COMMENT_REPLIES.slice(0, 3));
    const [replyInput, setReplyInput] = useState("");
    const [wizardDmMessage, setWizardDmMessage] = useState("");
    const [wizardSenders, setWizardSenders] = useState<string[]>([]);

    /* ── Wizard helpers ────────────── */

    function resetWizard(): void {
        setWizardStep(0);
        setWizardName("");
        setWizardPostUrl("");
        setWizardKeywords([]);
        setKeywordInput("");
        setWizardCommentReplies(DEFAULT_COMMENT_REPLIES.slice(0, 3));
        setReplyInput("");
        setWizardDmMessage("");
        setWizardSenders([]);
    }

    function addKeyword(): void {
        const trimmed = keywordInput.trim().toLowerCase();
        if (trimmed && !wizardKeywords.includes(trimmed)) {
            setWizardKeywords((prev) => [...prev, trimmed]);
        }
        setKeywordInput("");
    }

    function addCommentReply(): void {
        const trimmed = replyInput.trim();
        if (trimmed && !wizardCommentReplies.includes(trimmed)) {
            setWizardCommentReplies((prev) => [...prev, trimmed]);
        }
        setReplyInput("");
    }

    function toggleSender(id: string): void {
        setWizardSenders((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
        );
    }

    function createAutomation(): void {
        const newAuto: InboundAutomation = {
            id: `auto-${Date.now()}`,
            name: wizardName || "Untitled Automation",
            postUrl: wizardPostUrl,
            status: "paused",
            triggerKeywords: wizardKeywords,
            commentReplies: wizardCommentReplies,
            dmMessage: wizardDmMessage,
            senderIds: wizardSenders,
            completed: 0,
            processing: 0,
            failed: 0,
            createdAt: new Date().toISOString().split("T")[0],
        };
        setAutomations((prev) => [newAuto, ...prev]);
        resetWizard();
        setViewMode("list");
    }

    function toggleAutomationStatus(id: string): void {
        setAutomations((prev) =>
            prev.map((a) =>
                a.id === id
                    ? { ...a, status: a.status === "active" ? "paused" as const : "active" as const }
                    : a,
            ),
        );
    }

    function deleteAutomation(id: string): void {
        setAutomations((prev) => prev.filter((a) => a.id !== id));
        if (selectedAutomation?.id === id) {
            setSelectedAutomation(null);
            setViewMode("list");
        }
    }

    function duplicateAutomation(id: string): void {
        const source = automations.find((a) => a.id === id);
        if (!source) return;
        const dupe: InboundAutomation = {
            ...source,
            id: `auto-${Date.now()}`,
            name: `${source.name} (copy)`,
            status: "paused",
            completed: 0,
            processing: 0,
            failed: 0,
            createdAt: new Date().toISOString().split("T")[0],
        };
        setAutomations((prev) => [dupe, ...prev]);
    }

    function openDashboard(auto: InboundAutomation): void {
        setSelectedAutomation(auto);
        setViewMode("dashboard");
    }

    /* ─── Wizard Step Renderer ─────── */

    function renderWizardContent(): React.ReactNode {
        const step = WIZARD_STEPS[wizardStep];

        switch (step.key) {
            case "details":
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                                Campaign Name
                            </label>
                            <Input
                                value={wizardName}
                                onChange={(e) => setWizardName(e.target.value)}
                                placeholder="e.g. Lead Magnet — LinkedIn Playbook"
                                className="border-white/10 bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:ring-purple-500/20"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                                LinkedIn Post URL
                            </label>
                            <Input
                                value={wizardPostUrl}
                                onChange={(e) => setWizardPostUrl(e.target.value)}
                                placeholder="https://www.linkedin.com/posts/..."
                                className="border-white/10 bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:ring-purple-500/20"
                            />
                            <p className="mt-2 text-xs text-[var(--text-muted)]">
                                Paste the full URL of the LinkedIn post you want to monitor for comments.
                            </p>
                        </div>

                        {/* 7-step instruction guide */}
                        <div className="rounded-lg border border-white/6 bg-white/[0.02] p-4">
                            <h4 className="mb-3 text-sm font-medium text-[var(--text-primary)]">
                                How Inbound Automations Work
                            </h4>
                            <ol className="space-y-2 text-xs text-[var(--text-secondary)]">
                                <li className="flex gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[10px] font-bold text-purple-300">1</span>
                                    You publish a LinkedIn post with a call-to-action
                                </li>
                                <li className="flex gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[10px] font-bold text-purple-300">2</span>
                                    Paste the post URL here and set trigger keywords
                                </li>
                                <li className="flex gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[10px] font-bold text-purple-300">3</span>
                                    When someone comments with a keyword, the automation triggers
                                </li>
                                <li className="flex gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[10px] font-bold text-purple-300">4</span>
                                    A reply is posted to their comment (from your configured replies)
                                </li>
                                <li className="flex gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[10px] font-bold text-purple-300">5</span>
                                    A connection request is sent if not already connected
                                </li>
                                <li className="flex gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[10px] font-bold text-purple-300">6</span>
                                    A personalized DM is sent with your message template
                                </li>
                                <li className="flex gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[10px] font-bold text-purple-300">7</span>
                                    Track results in the automation dashboard
                                </li>
                            </ol>
                        </div>
                    </div>
                );

            case "keywords":
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                                Trigger Keywords
                            </label>
                            <p className="mb-3 text-xs text-[var(--text-secondary)]">
                                When someone comments on your post with any of these words, the automation triggers.
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    value={keywordInput}
                                    onChange={(e) => setKeywordInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                                    placeholder="Type a keyword and press Enter..."
                                    className="border-white/10 bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:ring-purple-500/20"
                                />
                                <Button
                                    onClick={addKeyword}
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0 border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                                >
                                    <Plus className="mr-1 h-3.5 w-3.5" />
                                    Add
                                </Button>
                            </div>
                        </div>

                        {wizardKeywords.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {wizardKeywords.map((kw) => (
                                    <Badge
                                        key={kw}
                                        variant="outline"
                                        className="gap-1 border-purple-500/30 bg-purple-500/10 text-purple-300"
                                    >
                                        {kw}
                                        <button
                                            onClick={() => setWizardKeywords((prev) => prev.filter((k) => k !== kw))}
                                            className="ml-0.5 rounded-full p-0.5 hover:bg-white/10"
                                        >
                                            <X className="h-2.5 w-2.5" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <div className="rounded-lg border border-white/6 bg-white/[0.02] p-4">
                            <p className="text-xs text-[var(--text-muted)]">
                                <strong className="text-[var(--text-secondary)]">Tip:</strong> Use broad keywords like <code className="rounded bg-white/5 px-1">&quot;interested&quot;</code>,{" "}
                                <code className="rounded bg-white/5 px-1">&quot;send&quot;</code>,{" "}
                                <code className="rounded bg-white/5 px-1">&quot;want&quot;</code>,{" "}
                                <code className="rounded bg-white/5 px-1">&quot;me&quot;</code> to capture most comments.
                            </p>
                        </div>
                    </div>
                );

            case "message":
                return (
                    <div className="space-y-6">
                        {/* DM template */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                                Direct Message
                            </label>
                            <p className="mb-2 text-xs text-[var(--text-secondary)]">
                                This message is sent as a DM after the comment is detected. Use <code className="rounded bg-white/5 px-1">{"{firstName}"}</code> for personalization.
                            </p>
                            <textarea
                                value={wizardDmMessage}
                                onChange={(e) => setWizardDmMessage(e.target.value)}
                                rows={5}
                                placeholder={`Hey {firstName}! Here's what you asked for...\n\nLet me know if you have questions!`}
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-input)] p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20"
                            />
                        </div>

                        {/* Comment replies */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                                Comment Replies
                            </label>
                            <p className="mb-2 text-xs text-[var(--text-secondary)]">
                                One of these replies is randomly posted under their comment. Add variety to look natural.
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    value={replyInput}
                                    onChange={(e) => setReplyInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCommentReply(); } }}
                                    placeholder="Type a reply and press Enter..."
                                    className="border-white/10 bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:ring-purple-500/20"
                                />
                                <Button
                                    onClick={addCommentReply}
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0 border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                                >
                                    <Plus className="mr-1 h-3.5 w-3.5" />
                                    Add
                                </Button>
                            </div>

                            {wizardCommentReplies.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {wizardCommentReplies.map((reply, i) => (
                                        <div
                                            key={`reply-${i}-${reply}`}
                                            className="flex items-center justify-between rounded-lg border border-white/6 bg-white/[0.02] px-3 py-2"
                                        >
                                            <span className="text-sm text-[var(--text-primary)]">{reply}</span>
                                            <button
                                                onClick={() => setWizardCommentReplies((prev) => prev.filter((_, idx) => idx !== i))}
                                                className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-red-400"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );

            case "senders":
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                                Select LinkedIn Accounts
                            </label>
                            <p className="mb-3 text-xs text-[var(--text-secondary)]">
                                Choose which LinkedIn accounts will reply to comments and send DMs.
                            </p>
                        </div>

                        <div className="space-y-2">
                            {MOCK_SENDERS.map((sender) => {
                                const isSelected = wizardSenders.includes(sender.id);
                                return (
                                    <button
                                        key={sender.id}
                                        onClick={() => toggleSender(sender.id)}
                                        className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition ${isSelected
                                            ? "border-purple-500/50 bg-purple-500/10"
                                            : "border-white/10 bg-[var(--bg-input)] hover:bg-white/5"
                                            }`}
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-sm font-medium text-purple-300">
                                            {sender.avatar}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-[var(--text-primary)]">{sender.name}</p>
                                            <p className="text-xs text-[var(--text-secondary)]">{sender.title}</p>
                                        </div>
                                        {isSelected && (
                                            <CheckCircle2 className="h-5 w-5 text-purple-400" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );

            case "review":
                return (
                    <div className="space-y-6">
                        <h3 className="text-sm font-medium text-[var(--text-primary)]">Review Your Automation</h3>

                        <div className="space-y-4 rounded-lg border border-white/6 bg-white/[0.02] p-5">
                            {/* Name */}
                            <div>
                                <span className="text-xs text-[var(--text-muted)]">Campaign Name</span>
                                <p className="text-sm font-medium text-[var(--text-primary)]">{wizardName || "—"}</p>
                            </div>

                            {/* Post URL */}
                            <div>
                                <span className="text-xs text-[var(--text-muted)]">Post URL</span>
                                <p className="truncate text-sm text-blue-400">{wizardPostUrl || "—"}</p>
                            </div>

                            {/* Keywords */}
                            <div>
                                <span className="text-xs text-[var(--text-muted)]">Trigger Keywords</span>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                    {wizardKeywords.length > 0
                                        ? wizardKeywords.map((kw) => (
                                            <Badge key={kw} variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs">
                                                {kw}
                                            </Badge>
                                        ))
                                        : <span className="text-xs text-[var(--text-muted)]">None set</span>
                                    }
                                </div>
                            </div>

                            {/* Comment Replies */}
                            <div>
                                <span className="text-xs text-[var(--text-muted)]">Comment Replies ({wizardCommentReplies.length})</span>
                                <div className="mt-1 space-y-1">
                                    {wizardCommentReplies.map((r, i) => (
                                        <p key={`rev-${i}-${r}`} className="text-sm text-[var(--text-secondary)]">&quot;{r}&quot;</p>
                                    ))}
                                </div>
                            </div>

                            {/* DM */}
                            <div>
                                <span className="text-xs text-[var(--text-muted)]">Direct Message</span>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{wizardDmMessage || "—"}</p>
                            </div>

                            {/* Senders */}
                            <div>
                                <span className="text-xs text-[var(--text-muted)]">LinkedIn Senders</span>
                                <div className="mt-1 flex gap-2">
                                    {wizardSenders.length > 0
                                        ? MOCK_SENDERS.filter((s) => wizardSenders.includes(s.id)).map((sender) => (
                                            <div key={sender.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-[var(--bg-input)] px-3 py-2">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-[10px] font-medium text-purple-300">{sender.avatar}</div>
                                                <span className="text-xs text-[var(--text-primary)]">{sender.name}</span>
                                            </div>
                                        ))
                                        : <span className="text-xs text-[var(--text-muted)]">None selected</span>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    }

    /* ─── Dashboard View ──────────── */

    function renderDashboard(): React.ReactNode {
        if (!selectedAutomation) return null;
        const auto = selectedAutomation;
        const totalProcessed = auto.completed + auto.processing + auto.failed;
        const conversionRate = totalProcessed > 0 ? Math.round((auto.completed / totalProcessed) * 100) : 0;

        const KPI_CARDS = [
            { label: "Completed", value: auto.completed, color: "text-green-400", borderColor: "border-green-500/40", icon: CheckCircle2 },
            { label: "Processing", value: auto.processing, color: "text-amber-400", borderColor: "border-amber-500/40", icon: Clock },
            { label: "Failed", value: auto.failed, color: "text-red-400", borderColor: "border-red-500/40", icon: AlertCircle },
            { label: "Conversion", value: `${conversionRate}%`, color: "text-purple-400", borderColor: "border-purple-500/40", icon: BarChart3 },
        ];

        const MOCK_COMMENTS = [
            { id: "c1", author: "Maria Chen", comment: "Interested! Send it over please", status: "completed" as const, time: "2h ago" },
            { id: "c2", author: "James Wilson", comment: "Would love the playbook!", status: "completed" as const, time: "4h ago" },
            { id: "c3", author: "Sofia Andersson", comment: "Can you send me this?", status: "processing" as const, time: "1h ago" },
            { id: "c4", author: "David Park", comment: "Very interested in this guide", status: "completed" as const, time: "6h ago" },
            { id: "c5", author: "Lisa Müller", comment: "Please send!", status: "failed" as const, time: "5h ago" },
        ];

        const MOCK_ACTIVITY_TIMELINE = [
            { id: "at1", action: "Comment detected from Maria Chen", time: "2h ago", type: "trigger" as const },
            { id: "at2", action: "Reply posted: \"Sent it!\"", time: "2h ago", type: "reply" as const },
            { id: "at3", action: "DM sent to Maria Chen", time: "2h ago", type: "dm" as const },
            { id: "at4", action: "Comment detected from Sofia Andersson", time: "1h ago", type: "trigger" as const },
            { id: "at5", action: "Connection request sent to Sofia Andersson", time: "1h ago", type: "connect" as const },
            { id: "at6", action: "Failed to send DM to Lisa Müller (rate limited)", time: "5h ago", type: "error" as const },
        ];

        const ACTIVITY_TYPE_COLORS: Record<string, string> = {
            trigger: "text-blue-400",
            reply: "text-green-400",
            dm: "text-purple-400",
            connect: "text-cyan-400",
            error: "text-red-400",
        };

        const COMMENT_STATUS_STYLES: Record<string, string> = {
            completed: "border-green-500/30 bg-green-500/15 text-green-300",
            processing: "border-amber-500/30 bg-amber-500/15 text-amber-300",
            failed: "border-red-500/30 bg-red-500/15 text-red-300",
        };

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setViewMode("list"); setSelectedAutomation(null); }}
                            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back
                        </Button>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{auto.name}</h2>
                        <Badge variant="outline" className={STATUS_STYLES[auto.status]}>
                            {auto.status === "active" ? "Monitoring Post" : "Paused"}
                        </Badge>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                    </Button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-4">
                    {KPI_CARDS.map((kpi) => (
                        <div
                            key={kpi.label}
                            className={`rounded-lg border-t-2 ${kpi.borderColor} border border-white/6 bg-[var(--bg-card)] p-4`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-[var(--text-secondary)]">{kpi.label}</span>
                                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                            </div>
                            <p className={`mt-2 text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                        </div>
                    ))}
                </div>

                {/* Post Info */}
                <div className="rounded-lg border border-white/6 bg-[var(--bg-card)] p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs text-[var(--text-muted)]">Monitored Post</span>
                            <p className="mt-1 truncate text-sm text-blue-400">{auto.postUrl}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs text-[var(--text-muted)]">
                            <ExternalLink className="h-3 w-3" />
                            Open
                        </Button>
                    </div>
                    <div className="mt-3 flex gap-4">
                        <div>
                            <span className="text-xs text-[var(--text-muted)]">Keywords</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                                {auto.triggerKeywords.map((kw) => (
                                    <Badge key={kw} variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs">
                                        {kw}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div>
                            <span className="text-xs text-[var(--text-muted)]">Senders</span>
                            <div className="mt-1 flex -space-x-2">
                                {MOCK_SENDERS.filter((s) => auto.senderIds.includes(s.id)).map((sender) => (
                                    <div
                                        key={sender.id}
                                        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--bg-card)] bg-purple-500/20 text-[9px] font-medium text-purple-300"
                                        title={sender.name}
                                    >
                                        {sender.avatar}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comments Table */}
                <div className="rounded-lg border border-white/6 bg-[var(--bg-card)]">
                    <div className="flex items-center justify-between border-b border-white/6 p-4">
                        <h3 className="text-sm font-medium text-[var(--text-primary)]">
                            Detected Comments ({MOCK_COMMENTS.length})
                        </h3>
                    </div>

                    {MOCK_COMMENTS.length > 0 ? (
                        <div className="divide-y divide-white/4">
                            {MOCK_COMMENTS.map((comment) => (
                                <div key={comment.id} className="flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs font-medium text-[var(--text-secondary)]">
                                            {comment.author.split(" ").map((n) => n[0]).join("")}
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-[var(--text-primary)]">{comment.author}</span>
                                            <p className="text-xs text-[var(--text-secondary)]">&quot;{comment.comment}&quot;</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-[var(--text-muted)]">{comment.time}</span>
                                        <Badge variant="outline" className={`text-xs ${COMMENT_STATUS_STYLES[comment.status]}`}>
                                            {comment.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <MessageSquare className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)] opacity-40" />
                            <p className="text-sm text-[var(--text-muted)]">No comments yet</p>
                        </div>
                    )}
                </div>

                {/* Analytics + Activity Grid */}
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Mini performance chart */}
                    <div className="rounded-lg border border-white/6 bg-[var(--bg-card)] p-4">
                        <h3 className="mb-3 text-sm font-medium text-[var(--text-primary)]">Performance Over Time</h3>
                        <div className="relative h-32 rounded-lg border border-white/6 bg-gradient-to-b from-white/[0.02] to-transparent p-3">
                            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-full w-full">
                                <defs>
                                    <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="rgba(34,197,94,0.3)" />
                                        <stop offset="100%" stopColor="rgba(34,197,94,0.02)" />
                                    </linearGradient>
                                </defs>
                                <path d="M0,35 C10,30 20,28 30,25 C40,22 50,18 60,15 C70,12 80,10 90,8 L100,7 L100,40 L0,40 Z" fill="url(#inboundGrad)" />
                                <path d="M0,35 C10,30 20,28 30,25 C40,22 50,18 60,15 C70,12 80,10 90,8 L100,7" stroke="rgba(34,197,94,0.8)" strokeWidth="1.5" fill="none" />
                            </svg>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
                            <span>7 days ago</span>
                            <span>Today</span>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-[var(--text-muted)]">Top keywords:</span>
                                {auto.triggerKeywords.slice(0, 3).map((kw) => (
                                    <Badge key={kw} variant="outline" className="text-[9px] border-purple-500/30 text-purple-300">{kw}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Timeline */}
                    <div className="rounded-lg border border-white/6 bg-[var(--bg-card)] p-4">
                        <h3 className="mb-3 text-sm font-medium text-[var(--text-primary)]">Recent Activity</h3>
                        <div className="space-y-3">
                            {MOCK_ACTIVITY_TIMELINE.map((event) => (
                                <div key={event.id} className="flex items-start gap-3">
                                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${event.type === "error" ? "bg-red-400" : event.type === "trigger" ? "bg-blue-400" : event.type === "reply" ? "bg-green-400" : event.type === "dm" ? "bg-purple-400" : "bg-cyan-400"}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs ${ACTIVITY_TYPE_COLORS[event.type]}`}>{event.action}</p>
                                        <p className="text-[10px] text-[var(--text-muted)]">{event.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Render ──────────────────── */

    /* Wizard view */
    if (viewMode === "wizard") {
        const currentStepObj = WIZARD_STEPS[wizardStep];
        const isLastStep = wizardStep === WIZARD_STEPS.length - 1;
        const canProceedMap: Record<WizardStepKey, boolean> = {
            details: wizardName.trim().length > 0 && wizardPostUrl.trim().length > 0,
            keywords: wizardKeywords.length > 0,
            message: wizardDmMessage.trim().length > 0,
            senders: wizardSenders.length > 0,
            review: true,
        };
        const canProceed = canProceedMap[currentStepObj.key];

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { resetWizard(); setViewMode("list"); }}
                            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Cancel
                        </Button>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">New Inbound Automation</h2>
                    </div>
                </div>

                {/* Steps indicator */}
                <div className="flex items-center gap-2">
                    {WIZARD_STEPS.map((s, i) => {
                        const isDone = i < wizardStep;
                        const isActive = i === wizardStep;
                        const Icon = s.icon;
                        return (
                            <div key={s.key} className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => { if (i < wizardStep) setWizardStep(i); }}
                                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${isActive
                                        ? "border-purple-500/50 bg-purple-500/15 text-purple-300"
                                        : isDone
                                            ? "border-green-500/30 bg-green-500/10 text-green-300"
                                            : "border-white/10 bg-[var(--bg-input)] text-[var(--text-muted)]"
                                        }`}
                                >
                                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                                    {s.label}
                                </button>
                                {i < WIZARD_STEPS.length - 1 && (
                                    <div className={`h-px w-6 ${i < wizardStep ? "bg-green-500/40" : "bg-white/10"}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Step content */}
                <div className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-6">
                    {renderWizardContent()}
                </div>

                {/* Navigation */}
                <div className="flex justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setWizardStep((prev) => Math.max(0, prev - 1))}
                        disabled={wizardStep === 0}
                        className="text-[var(--text-secondary)] disabled:opacity-30"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Previous
                    </Button>

                    {isLastStep ? (
                        <Button
                            size="sm"
                            onClick={createAutomation}
                            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
                        >
                            <Zap className="mr-1 h-4 w-4" />
                            Create Automation
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            onClick={() => setWizardStep((prev) => prev + 1)}
                            disabled={!canProceed}
                            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 disabled:opacity-50"
                        >
                            Next
                            <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    /* Dashboard view */
    if (viewMode === "dashboard") {
        return renderDashboard();
    }

    /* List view (default) */
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[var(--text-primary)]">Inbound Automations</h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Automate comment monitoring, replies, and DMs on your LinkedIn posts.
                    </p>
                </div>
                <Button
                    onClick={() => setViewMode("wizard")}
                    className="gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
                >
                    <Plus className="h-4 w-4" />
                    New Automation
                </Button>
            </div>

            {/* Automations Table */}
            <div className="rounded-xl border border-white/6 bg-[var(--bg-card)]">
                {automations.length > 0 ? (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/6 text-left">
                                <th className="px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">Automation Name</th>
                                <th className="px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">Status</th>
                                <th className="px-4 py-3 text-xs font-medium text-[var(--text-secondary)] text-center">Completed</th>
                                <th className="px-4 py-3 text-xs font-medium text-[var(--text-secondary)] text-center">Processing</th>
                                <th className="px-4 py-3 text-xs font-medium text-[var(--text-secondary)] text-center">Failed</th>
                                <th className="px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">Created</th>
                                <th className="px-4 py-3 text-xs font-medium text-[var(--text-secondary)] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/4">
                            {automations.map((auto) => (
                                <tr key={auto.id} className="transition-colors hover:bg-white/[0.02]">
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => openDashboard(auto)}
                                            className="text-sm font-medium text-[var(--text-primary)] hover:text-purple-300 transition-colors text-left"
                                        >
                                            {auto.name}
                                        </button>
                                        <p className="mt-0.5 truncate text-xs text-[var(--text-muted)] max-w-[280px]">
                                            {auto.postUrl}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline" className={`text-xs ${STATUS_STYLES[auto.status]}`}>
                                            {auto.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm font-medium text-green-400">{auto.completed}</td>
                                    <td className="px-4 py-3 text-center text-sm font-medium text-amber-400">{auto.processing}</td>
                                    <td className="px-4 py-3 text-center text-sm font-medium text-red-400">{auto.failed}</td>
                                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{auto.createdAt}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => toggleAutomationStatus(auto.id)}
                                                className="rounded p-1.5 text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--text-primary)]"
                                                title={auto.status === "active" ? "Pause" : "Activate"}
                                            >
                                                {auto.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                            </button>
                                            <button
                                                onClick={() => duplicateAutomation(auto.id)}
                                                className="rounded p-1.5 text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--text-primary)]"
                                                title="Duplicate"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => openDashboard(auto)}
                                                className="rounded p-1.5 text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--text-primary)]"
                                                title="View Dashboard"
                                            >
                                                <BarChart3 className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => deleteAutomation(auto.id)}
                                                className="rounded p-1.5 text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-red-400"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-16 text-center">
                        <Zap className="mx-auto mb-4 h-12 w-12 text-[var(--text-muted)] opacity-30" />
                        <h3 className="text-sm font-medium text-[var(--text-primary)]">No automations yet</h3>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                            Create your first inbound automation to start converting comments into leads.
                        </p>
                        <Button
                            onClick={() => setViewMode("wizard")}
                            className="mt-4 gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                        >
                            <Plus className="h-4 w-4" />
                            New Automation
                        </Button>
                    </div>
                )}
            </div>

            {/* Per-automation analytics hint */}
            {automations.length > 0 && (
                <p className="text-center text-xs text-[var(--text-muted)]">
                    Click an automation name to view its dashboard with comment tracking and analytics.
                </p>
            )}
        </div>
    );
}
