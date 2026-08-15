// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/empty-state";
import {
    Archive,
    ChevronDown,
    Filter,
    Inbox,
    Loader2,
    MessageSquare,
    Paperclip,
    RefreshCw,
    Search,
    Send,
    Smile,
    Sparkles,
    Star,
    StickyNote,
    Tag,
    Trash2,
    User,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */

type FilterTab = "all" | "unread" | "starred" | "archived";

interface ConversationRow {
    leadId: string;
    leadName: string;
    leadTitle: string | null;
    leadCompany: string | null;
    leadAvatarUrl: string | null;
    linkedinAccountId: string | null;
    linkedinAccountName: string | null;
    lastMessage: string;
    lastMessageDirection: string | null;
    lastMessageAt: string;
    unreadCount: number;
    isStarred: boolean;
    campaignName: string | null;
}

interface MessageRow {
    id: string;
    direction: string | null;
    content: string;
    messageType: string | null;
    read: boolean;
    starred: boolean;
    sentAt: string;
    lead?: { firstName: string | null; lastName: string | null } | null;
    linkedinAccount?: { accountName: string } | null;
}

interface AiSuggestion {
    text: string;
    tone: string;
}

/* ─── Helpers ───────────────────────────────────────── */

const SENTIMENT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    positive: { bg: "bg-green-500/15 border-green-500/30", text: "text-green-300", label: "Positive" },
    neutral: { bg: "bg-amber-500/15 border-amber-500/30", text: "text-amber-300", label: "Neutral" },
    negative: { bg: "bg-red-500/15 border-red-500/30", text: "text-red-300", label: "Negative" },
};

function getInitials(name: string): string {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w.charAt(0))
        .join("")
        .toUpperCase();
}

function formatTimestamp(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
}

/* ─── Component ─────────────────────────────────────── */

/**
 * Unibox — unified LinkedIn inbox with real data from API.
 */
export default function UniboxPage() {
    const [filterTab, setFilterTab] = useState<FilterTab>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState("");
    const [showAiSuggestions, setShowAiSuggestions] = useState(false);
    const [isAiDrafted, setIsAiDrafted] = useState(false);
    const [sending, setSending] = useState(false);

    // Data
    const [conversations, setConversations] = useState<ConversationRow[]>([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [messages, setMessages] = useState<MessageRow[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    /* ─── Fetch conversations ───────────────────────── */

    const fetchConversations = useCallback(async () => {
        setLoadingConversations(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set("search", searchQuery);
            if (filterTab === "unread") params.set("unreadOnly", "true");
            if (filterTab === "starred") params.set("starredOnly", "true");

            const res = await fetch(`/api/messages?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch conversations");
            const json = await res.json();
            const items: ConversationRow[] = (json.data ?? []).map(
                (c: {
                    leadId: string;
                    leadName: string;
                    leadTitle: string | null;
                    leadCompany: string | null;
                    leadAvatarUrl: string | null;
                    linkedinAccountId: string | null;
                    linkedinAccountName: string | null;
                    lastMessage: string;
                    lastMessageDirection: string | null;
                    lastMessageAt: string;
                    unreadCount: number;
                    isStarred: boolean;
                    campaignName: string | null;
                }) => ({
                    ...c,
                    lastMessageAt: c.lastMessageAt,
                }),
            );
            setConversations(items);

            // Auto-select first if none selected
            if (!selectedLeadId && items.length > 0) {
                setSelectedLeadId(items[0].leadId);
            }
        } catch {
            setConversations([]);
        } finally {
            setLoadingConversations(false);
        }
    }, [searchQuery, filterTab, selectedLeadId]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    /* ─── Fetch messages for selected conversation ──── */

    const fetchMessages = useCallback(async (leadId: string) => {
        setLoadingMessages(true);
        try {
            const res = await fetch(`/api/messages?leadId=${leadId}&pageSize=100`);
            if (!res.ok) throw new Error("Failed to fetch messages");
            const json = await res.json();
            setMessages(json.data?.data ?? []);
        } catch {
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    useEffect(() => {
        if (selectedLeadId) {
            fetchMessages(selectedLeadId);
        }
    }, [selectedLeadId, fetchMessages]);

    /* ─── Send message ──────────────────────────────── */

    async function handleSend(): Promise<void> {
        if (!messageInput.trim() || !selectedLeadId) return;
        setSending(true);
        try {
            const selectedConvo = conversations.find((c) => c.leadId === selectedLeadId);
            await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    leadId: selectedLeadId,
                    linkedinAccountId: selectedConvo?.linkedinAccountId ?? undefined,
                    direction: "sent",
                    content: messageInput.trim(),
                    messageType: "text",
                }),
            });
            setMessageInput("");
            setIsAiDrafted(false);
            // Refresh thread
            fetchMessages(selectedLeadId);
            fetchConversations();
        } catch {
            // Silent
        } finally {
            setSending(false);
        }
    }

    /* ─── Toggle star ───────────────────────────────── */

    async function handleToggleStar(): Promise<void> {
        if (!selectedLeadId || messages.length === 0) return;
        // Toggle star on last message
        const lastMsg = messages[messages.length - 1];
        try {
            await fetch(`/api/messages/${lastMsg.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "toggleStar" }),
            });
            fetchConversations();
        } catch {
            // Silent
        }
    }

    /* ─── AI Suggestions ────────────────────────────── */

    async function generateSuggestions(): Promise<void> {
        if (!selectedLeadId || messages.length === 0) return;
        setLoadingSuggestions(true);
        setShowAiSuggestions(true);
        try {
            const lastFewMessages = messages.slice(-5).map((m) => ({
                role: m.direction === "sent" ? "assistant" : "user",
                content: m.content,
            }));

            const res = await fetch("/api/content/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category: "reply_suggestions",
                    topic: "LinkedIn reply",
                    targetAudience: "lead",
                    language: "en",
                    tone: "professional",
                    context: JSON.stringify(lastFewMessages),
                }),
            });

            if (res.ok) {
                const json = await res.json();
                const content = json.content ?? json.data?.generatedContent ?? "";
                // Parse AI response as suggestions
                const lines = content.split("\n").filter((l: string) => l.trim().length > 20);
                setAiSuggestions(
                    lines.slice(0, 3).map((text: string, idx: number) => ({
                        text: text.replace(/^\d+[\.\)]\s*/, "").replace(/^\*\*.*?\*\*\s*/, "").trim(),
                        tone: idx === 0 ? "Professional" : idx === 1 ? "Friendly" : "Value-add",
                    })),
                );
            } else {
                setAiSuggestions([]);
            }
        } catch {
            setAiSuggestions([]);
        } finally {
            setLoadingSuggestions(false);
        }
    }

    /* ─── Derived state ─────────────────────────────── */

    const activeConvo = conversations.find((c) => c.leadId === selectedLeadId);
    const unreadCount = conversations.filter((c) => c.unreadCount > 0).length;
    const starredCount = conversations.filter((c) => c.isStarred).length;

    const FILTER_TABS: { value: FilterTab; label: string; count: number }[] = [
        { value: "all", label: "All", count: conversations.length },
        { value: "unread", label: "Unread", count: unreadCount },
        { value: "starred", label: "Starred", count: starredCount },
        { value: "archived", label: "Archived", count: 0 },
    ];

    return (
        <div className="flex h-full flex-1 overflow-hidden">
            {/* ─── Left panel: conversation list ─── */}
            <div className="flex w-96 flex-shrink-0 flex-col border-r border-white/6">
                {/* Search */}
                <div className="border-b border-white/6 px-4 py-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                        <Input
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 border-white/10 bg-[var(--bg-input)] pl-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:ring-purple-500/20"
                        />
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="flex border-b border-white/6">
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setFilterTab(tab.value)}
                            className={`flex-1 py-2.5 text-center text-xs font-medium transition-colors ${
                                filterTab === tab.value
                                    ? "border-b-2 border-purple-500 text-purple-300"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="ml-1 text-[10px] text-[var(--text-muted)]">
                                    ({tab.count})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Account filter */}
                <div className="flex items-center justify-between border-b border-white/6 px-4 py-2">
                    <button className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <Filter className="h-3 w-3" />
                        All Accounts
                        <ChevronDown className="h-3 w-3" />
                    </button>
                    <span className="text-xs text-[var(--text-muted)]">
                        {conversations.length} conversations
                    </span>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto">
                    {loadingConversations ? (
                        <div className="space-y-1 p-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-20 animate-pulse rounded-lg bg-white/5"
                                />
                            ))}
                        </div>
                    ) : conversations.length === 0 ? (
                        <EmptyState
                            icon={Inbox}
                            title="No conversations yet"
                            description="Start a campaign to begin receiving replies from leads."
                        />
                    ) : (
                        conversations.map((convo) => (
                            <button
                                key={convo.leadId}
                                onClick={() => setSelectedLeadId(convo.leadId)}
                                className={`w-full border-b border-white/4 px-4 py-3 text-left transition-colors ${
                                    selectedLeadId === convo.leadId
                                        ? "bg-purple-500/10 border-l-2 border-l-purple-500"
                                        : "hover:bg-white/3"
                                } ${convo.unreadCount > 0 ? "bg-white/[0.02]" : ""}`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600/25 text-sm font-medium text-purple-300">
                                            {getInitials(convo.leadName)}
                                        </div>
                                        {convo.unreadCount > 0 && (
                                            <div className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
                                                {convo.unreadCount}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`truncate text-sm ${
                                                    convo.unreadCount > 0
                                                        ? "font-semibold text-[var(--text-primary)]"
                                                        : "font-medium text-[var(--text-primary)]"
                                                }`}
                                            >
                                                {convo.leadName}
                                            </span>
                                            <span className="ml-2 flex-shrink-0 text-[10px] text-[var(--text-muted)]">
                                                {formatTimestamp(convo.lastMessageAt)}
                                            </span>
                                        </div>
                                        <p className="truncate text-xs text-[var(--text-muted)]">
                                            {convo.leadTitle
                                                ? `${convo.leadTitle}${convo.leadCompany ? ` at ${convo.leadCompany}` : ""}`
                                                : (convo.leadCompany ?? "")}
                                        </p>
                                        <p
                                            className={`mt-1 truncate text-xs ${
                                                convo.unreadCount > 0
                                                    ? "text-[var(--text-secondary)]"
                                                    : "text-[var(--text-muted)]"
                                            }`}
                                        >
                                            {convo.lastMessageDirection === "sent" && (
                                                <span className="text-[var(--text-muted)]">
                                                    You:{" "}
                                                </span>
                                            )}
                                            {convo.lastMessage}
                                        </p>

                                        {/* Tags row */}
                                        <div className="mt-1.5 flex items-center gap-1.5">
                                            {convo.campaignName && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-white/10 px-1.5 py-0 text-[9px] text-[var(--text-muted)]"
                                                >
                                                    {convo.campaignName}
                                                </Badge>
                                            )}
                                            <div className="flex-1" />
                                            {convo.linkedinAccountName && (
                                                <Badge
                                                    variant="outline"
                                                    className="border-white/10 px-1 py-0 text-[9px] text-[var(--text-muted)]"
                                                >
                                                    {getInitials(convo.linkedinAccountName)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* ─── Right panel: message thread ─── */}
            {activeConvo ? (
                <div className="flex flex-1 flex-col">
                    {/* Thread header */}
                    <div className="flex items-center justify-between border-b border-white/6 px-6 py-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600/25 text-sm font-medium text-purple-300">
                                {getInitials(activeConvo.leadName)}
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                                    {activeConvo.leadName}
                                </h3>
                                <p className="text-xs text-[var(--text-muted)]">
                                    {activeConvo.leadTitle
                                        ? `${activeConvo.leadTitle}${activeConvo.leadCompany ? ` at ${activeConvo.leadCompany}` : ""}`
                                        : (activeConvo.leadCompany ?? "")}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleToggleStar}
                                className={`h-8 w-8 p-0 ${
                                    activeConvo.isStarred
                                        ? "text-amber-400"
                                        : "text-[var(--text-muted)] hover:text-amber-400"
                                }`}
                                title="Star"
                            >
                                <Star
                                    className={`h-4 w-4 ${activeConvo.isStarred ? "fill-current" : ""}`}
                                />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                title="Notes"
                            >
                                <StickyNote className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                title="Archive"
                            >
                                <Archive className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-[var(--text-muted)] hover:text-red-400"
                                title="Delete"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Campaign banner */}
                    {activeConvo.campaignName && (
                        <div className="flex items-center gap-2 border-b border-white/6 bg-purple-500/5 px-6 py-2">
                            <Tag className="h-3.5 w-3.5 text-purple-400" />
                            <span className="text-xs text-purple-300">
                                Campaign: {activeConvo.campaignName}
                            </span>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {loadingMessages ? (
                            <div className="mx-auto max-w-2xl space-y-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-white/5" />
                                    </div>
                                ))}
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex h-full items-center justify-center">
                                <p className="text-sm text-[var(--text-muted)]">
                                    No messages in this conversation
                                </p>
                            </div>
                        ) : (
                            <div className="mx-auto max-w-2xl space-y-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${
                                            msg.direction === "sent"
                                                ? "justify-end"
                                                : "justify-start"
                                        }`}
                                    >
                                        <div
                                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                                                msg.direction === "sent"
                                                    ? "bg-purple-500/20 text-[var(--text-primary)]"
                                                    : "bg-white/5 text-[var(--text-primary)]"
                                            }`}
                                        >
                                            {msg.messageType === "connection_request" && (
                                                <div className="mb-1.5 flex items-center gap-1">
                                                    <User className="h-3 w-3 text-blue-400" />
                                                    <span className="text-[10px] font-medium text-blue-400">
                                                        Connection Request
                                                    </span>
                                                </div>
                                            )}
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                                {msg.content}
                                            </p>
                                            <p
                                                className={`mt-1.5 text-[10px] ${
                                                    msg.direction === "sent"
                                                        ? "text-purple-300/60"
                                                        : "text-[var(--text-muted)]"
                                                }`}
                                            >
                                                {formatTimestamp(msg.sentAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* AI suggestions */}
                    {showAiSuggestions && (
                        <div className="border-t border-white/6 bg-purple-500/5 px-6 py-3">
                            <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                                    <span className="text-xs font-medium text-purple-300">
                                        AI Reply Suggestions
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className="border-purple-500/30 bg-purple-500/10 text-[9px] text-purple-300"
                                    >
                                        Powered by Claude
                                    </Badge>
                                </div>
                                <button
                                    onClick={generateSuggestions}
                                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-purple-300 transition-colors hover:bg-purple-500/10"
                                >
                                    <RefreshCw
                                        className={`h-3 w-3 ${loadingSuggestions ? "animate-spin" : ""}`}
                                    />
                                    Regenerate
                                </button>
                            </div>
                            {loadingSuggestions ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="h-10 animate-pulse rounded-lg bg-purple-500/10"
                                        />
                                    ))}
                                </div>
                            ) : aiSuggestions.length === 0 ? (
                                <p className="text-xs text-[var(--text-muted)]">
                                    No suggestions generated. Try again.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {aiSuggestions.map((suggestion, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setMessageInput(suggestion.text);
                                                setShowAiSuggestions(false);
                                                setIsAiDrafted(true);
                                            }}
                                            className="w-full rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-2 text-left transition-colors hover:border-purple-500/40 hover:bg-purple-500/15"
                                        >
                                            <div className="mb-1 flex items-center gap-1.5">
                                                <Badge
                                                    variant="outline"
                                                    className="border-purple-500/30 px-1.5 py-0 text-[9px] text-purple-300"
                                                >
                                                    {suggestion.tone}
                                                </Badge>
                                            </div>
                                            <span className="text-xs text-[var(--text-secondary)]">
                                                {suggestion.text}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Message input */}
                    <div className="border-t border-white/6 px-6 py-3">
                        <div className="flex items-end gap-3">
                            <div className="flex-1">
                                <textarea
                                    placeholder="Type a message..."
                                    aria-label="Message input"
                                    value={messageInput}
                                    onChange={(e) => {
                                        setMessageInput(e.target.value);
                                        if (isAiDrafted) setIsAiDrafted(false);
                                    }}
                                    rows={messageInput.split("\n").length > 3 ? 4 : 2}
                                    className="w-full resize-none rounded-xl border border-white/10 bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20"
                                />
                                <div className="mt-2 flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                        title="Emoji"
                                    >
                                        <Smile className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                        title="Attach"
                                    >
                                        <Paperclip className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            if (showAiSuggestions) {
                                                setShowAiSuggestions(false);
                                            } else {
                                                generateSuggestions();
                                            }
                                        }}
                                        className={`h-7 gap-1 px-2 text-xs ${
                                            showAiSuggestions
                                                ? "text-purple-400"
                                                : "text-[var(--text-muted)] hover:text-purple-400"
                                        }`}
                                    >
                                        <Sparkles className="h-3.5 w-3.5" />
                                        AI Suggest
                                    </Button>
                                    <div className="flex-1" />
                                    {isAiDrafted && (
                                        <Badge
                                            variant="outline"
                                            className="gap-1 border-purple-500/30 bg-purple-500/10 text-[10px] text-purple-300"
                                        >
                                            <Sparkles className="h-2.5 w-2.5" />
                                            AI-drafted
                                        </Badge>
                                    )}
                                    {activeConvo.linkedinAccountName && (
                                        <Badge
                                            variant="outline"
                                            className="border-white/10 text-[10px] text-[var(--text-muted)]"
                                        >
                                            via {activeConvo.linkedinAccountName}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <Button
                                disabled={!messageInput.trim() || sending}
                                onClick={handleSend}
                                className="h-10 w-10 rounded-xl bg-purple-600 p-0 text-white hover:bg-purple-500 disabled:opacity-40"
                            >
                                {sending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-1 items-center justify-center">
                    <div className="text-center">
                        <MessageSquare className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" />
                        <p className="text-sm text-[var(--text-secondary)]">
                            Select a conversation to start messaging
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
