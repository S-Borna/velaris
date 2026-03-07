// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/empty-state";
import {
    Archive,
    ChevronDown,
    Filter,
    Inbox,
    MessageSquare,
    MoreHorizontal,
    Paperclip,
    RefreshCw,
    Search,
    Send,
    Smile,
    Sparkles,
    Star,
    StarOff,
    StickyNote,
    Tag,
    Trash2,
    User,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */

type ConversationStatus = "unread" | "read" | "starred" | "archived";
type SentimentTag = "positive" | "neutral" | "negative" | null;

interface Conversation {
    id: string;
    leadName: string;
    leadTitle: string;
    leadCompany: string;
    leadAvatar: string;
    linkedinAccountName: string;
    linkedinAccountAvatar: string;
    lastMessage: string;
    lastMessageAt: string;
    lastMessageDirection: "sent" | "received";
    status: ConversationStatus;
    unreadCount: number;
    sentiment: SentimentTag;
    campaignName: string | null;
    note: string | null;
}

interface Message {
    id: string;
    conversationId: string;
    direction: "sent" | "received";
    content: string;
    timestamp: string;
    type: "text" | "connection_request" | "voice_note" | "inmail";
    read: boolean;
}

/* ─── Mock data ─────────────────────────────────────── */

const MOCK_CONVERSATIONS: Conversation[] = [
    { id: "conv1", leadName: "[redacted]", leadTitle: "Co-Founder", leadCompany: "[redacted]", leadAvatar: "JK", linkedinAccountName: "Said Borna", linkedinAccountAvatar: "SB", lastMessage: "That sounds great! Let's set up a call next week.", lastMessageAt: "2 min ago", lastMessageDirection: "received", status: "unread", unreadCount: 2, sentiment: "positive", campaignName: "SaaS Founders Europe", note: "High priority — VC co-founder" },
    { id: "conv2", leadName: "[redacted]", leadTitle: "Co-Founder & CEO", leadCompany: "Velaris", leadAvatar: "EN", linkedinAccountName: "Said Borna", linkedinAccountAvatar: "SB", lastMessage: "Thanks for reaching out! I'm curious about what you're building.", lastMessageAt: "15 min ago", lastMessageDirection: "received", status: "unread", unreadCount: 1, sentiment: "positive", campaignName: "Outreach to Agency Owners", note: null },
    { id: "conv3", leadName: "Anna Lindqvist", leadTitle: "VP of Sales", leadCompany: "Klarna", leadAvatar: "AL", linkedinAccountName: "Said Borna", linkedinAccountAvatar: "SB", lastMessage: "I'll check with my team and get back to you by Friday.", lastMessageAt: "1 hour ago", lastMessageDirection: "received", status: "read", unreadCount: 0, sentiment: "neutral", campaignName: "B2B Decision Makers", note: null },
    { id: "conv4", leadName: "Marcus Weber", leadTitle: "Head of Growth", leadCompany: "N26", leadAvatar: "MW", linkedinAccountName: "Said Borna", linkedinAccountAvatar: "SB", lastMessage: "Hi Marcus, I wanted to follow up on our conversation last week. Are you still interested in exploring this further?", lastMessageAt: "3 hours ago", lastMessageDirection: "sent", status: "read", unreadCount: 0, sentiment: null, campaignName: "SaaS Founders Europe", note: null },
    { id: "conv5", leadName: "Sophie Dupont", leadTitle: "Director of Marketing", leadCompany: "Contentsquare", leadAvatar: "SD", linkedinAccountName: "Said Borna", linkedinAccountAvatar: "SB", lastMessage: "Not interested at the moment, but feel free to reach out again next quarter.", lastMessageAt: "Yesterday", lastMessageDirection: "received", status: "read", unreadCount: 0, sentiment: "negative", campaignName: "Marketing Directors DACH", note: "Follow up Q2" },
    { id: "conv6", leadName: "James Henderson", leadTitle: "CEO", leadCompany: "ScaleUp Labs", leadAvatar: "JH", linkedinAccountName: "Said Borna", linkedinAccountAvatar: "SB", lastMessage: "Absolutely, I'd love to see a demo. Can you send me a link?", lastMessageAt: "Yesterday", lastMessageDirection: "received", status: "starred", unreadCount: 0, sentiment: "positive", campaignName: "Series A Startups", note: "Warm — wants demo" },
    { id: "conv7", leadName: "Priya Patel", leadTitle: "Senior Account Executive", leadCompany: "HubSpot", leadAvatar: "PP", linkedinAccountName: "Said Borna", linkedinAccountAvatar: "SB", lastMessage: "Thanks for connecting! How can I help?", lastMessageAt: "2 days ago", lastMessageDirection: "received", status: "read", unreadCount: 0, sentiment: "neutral", campaignName: null, note: null },
    { id: "conv8", leadName: "Erik Johansson", leadTitle: "Founder", leadCompany: "GrowthHive", leadAvatar: "EJ", linkedinAccountName: "Said Borna", linkedinAccountAvatar: "SB", lastMessage: "Connection accepted", lastMessageAt: "3 days ago", lastMessageDirection: "received", status: "read", unreadCount: 0, sentiment: null, campaignName: "Outreach to Agency Owners", note: null },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
    conv1: [
        { id: "m1", conversationId: "conv1", direction: "sent", content: "Hi Jonas! I came across [redacted] and I'm really impressed with the portfolio. I'm building an AI-powered LinkedIn automation platform and would love to get your thoughts.", timestamp: "Yesterday 10:30 AM", type: "connection_request", read: true },
        { id: "m2", conversationId: "conv1", direction: "received", content: "Hey Said! Thanks for reaching out. Always interesting to hear about new tools in this space. What makes yours different?", timestamp: "Yesterday 2:15 PM", type: "text", read: true },
        { id: "m3", conversationId: "conv1", direction: "sent", content: "Great question! Three key differentiators:\n\n1. AI-powered ICP scoring — we use Claude to research each lead and score 0-100 based on your ideal customer profile\n2. Visual sequence builder — bug-free node-based flow editor (biggest complaint about competitors)\n3. All-in-one: outreach + content + inbox in one dashboard\n\nWould love to show you a quick demo.", timestamp: "Yesterday 3:45 PM", type: "text", read: true },
        { id: "m4", conversationId: "conv1", direction: "received", content: "Those are solid differentiators. The ICP scoring sounds particularly interesting. How accurate is it?", timestamp: "Today 9:00 AM", type: "text", read: true },
        { id: "m5", conversationId: "conv1", direction: "sent", content: "We're seeing 85%+ accuracy in beta testing. The Claude API does deep research on each lead — checking their company size, industry, role seniority, and recent activity. Leads below your threshold get automatically filtered out before entering the sequence.", timestamp: "Today 9:30 AM", type: "text", read: true },
        { id: "m6", conversationId: "conv1", direction: "received", content: "That sounds great! Let's set up a call next week.", timestamp: "Today 9:58 AM", type: "text", read: false },
    ],
    conv2: [
        { id: "m7", conversationId: "conv2", direction: "sent", content: "Hi Elliot! Fellow LinkedIn automation builder here 👋 Would love to connect and exchange ideas.", timestamp: "Today 8:00 AM", type: "connection_request", read: true },
        { id: "m8", conversationId: "conv2", direction: "received", content: "Thanks for reaching out! I'm curious about what you're building.", timestamp: "Today 8:45 AM", type: "text", read: false },
    ],
    conv6: [
        { id: "m9", conversationId: "conv6", direction: "sent", content: "Hi James, I saw your post about scaling outbound — really resonated with my experience. We've built a tool that automates the entire process.", timestamp: "3 days ago 2:00 PM", type: "connection_request", read: true },
        { id: "m10", conversationId: "conv6", direction: "received", content: "Hey! Yeah that post got a lot of traction. What tool are you building?", timestamp: "2 days ago 10:00 AM", type: "text", read: true },
        { id: "m11", conversationId: "conv6", direction: "sent", content: "It's called OutreachPilot — think of it as the all-in-one LinkedIn automation platform. AI content generation, smart sequences, unified inbox, and a 300M+ lead database. All in one dashboard.", timestamp: "2 days ago 11:30 AM", type: "text", read: true },
        { id: "m12", conversationId: "conv6", direction: "received", content: "Absolutely, I'd love to see a demo. Can you send me a link?", timestamp: "Yesterday 3:00 PM", type: "text", read: true },
    ],
};

/* ─── AI suggestions ────────────────────────────────── */

interface AiSuggestion {
    text: string;
    tone: string;
}

const AI_SUGGESTIONS: Record<string, AiSuggestion[]> = {
    conv1: [
        { text: "Thanks Jonas! How about Tuesday or Wednesday? I have openings at 10 AM and 2 PM CET.", tone: "Professional" },
        { text: "Perfect! I'll send over a Calendly link — pick whatever suits you best.", tone: "Friendly" },
        { text: "Great, looking forward to it! I'll prepare a custom demo showing ICP scoring with your portfolio companies.", tone: "Value-add" },
    ],
    conv2: [
        { text: "Thanks Elliot! We're building OutreachPilot — an AI-powered LinkedIn automation platform. Would love to exchange notes since you're in the same space.", tone: "Professional" },
        { text: "Appreciate the curiosity! It's a full-stack LinkedIn platform: outreach sequences, AI content, unified inbox, and 300M+ lead database. Happy to jump on a call if you're interested.", tone: "Detailed" },
    ],
    conv6: [
        { text: "Absolutely! Here's our demo link: https://cal.com/outreachpilot/demo — pick any time that works for you.", tone: "Direct" },
        { text: "Sure thing! I'll send you a personalized demo link. What's the best email to send it to?", tone: "Friendly" },
    ],
};

/* ─── Filter options ────────────────────────────────── */

type FilterTab = "all" | "unread" | "starred" | "archived";

const FILTER_TABS: { value: FilterTab; label: string; count: number }[] = [
    { value: "all", label: "All", count: 8 },
    { value: "unread", label: "Unread", count: 2 },
    { value: "starred", label: "Starred", count: 1 },
    { value: "archived", label: "Archived", count: 0 },
];

const SENTIMENT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    positive: { bg: "bg-green-500/15 border-green-500/30", text: "text-green-300", label: "Positive" },
    neutral: { bg: "bg-amber-500/15 border-amber-500/30", text: "text-amber-300", label: "Neutral" },
    negative: { bg: "bg-red-500/15 border-red-500/30", text: "text-red-300", label: "Negative" },
};

/* ─── Component ─────────────────────────────────────── */

/**
 * Unibox — unified LinkedIn inbox.
 * Left panel: conversation list with filters. Right panel: message thread with AI suggestions.
 */
export default function UniboxPage() {
    const [filterTab, setFilterTab] = useState<FilterTab>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedConversation, setSelectedConversation] = useState<string>("conv1");
    const [messageInput, setMessageInput] = useState("");
    const [showAiSuggestions, setShowAiSuggestions] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [isAiDrafted, setIsAiDrafted] = useState(false);
    const [starredIds, setStarredIds] = useState<Set<string>>(new Set(["conv6"]));

    /* ─── Filtered conversations ────────────────────── */

    const filtered = useMemo(() => {
        let result = [...MOCK_CONVERSATIONS];

        if (filterTab === "unread") {
            result = result.filter((c) => c.unreadCount > 0);
        } else if (filterTab === "starred") {
            result = result.filter((c) => starredIds.has(c.id));
        } else if (filterTab === "archived") {
            result = result.filter((c) => c.status === "archived");
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (c) =>
                    c.leadName.toLowerCase().includes(q) ||
                    c.leadCompany.toLowerCase().includes(q) ||
                    c.lastMessage.toLowerCase().includes(q)
            );
        }

        return result;
    }, [filterTab, searchQuery, starredIds]);

    const activeConvo = MOCK_CONVERSATIONS.find((c) => c.id === selectedConversation);
    const messages = selectedConversation ? MOCK_MESSAGES[selectedConversation] ?? [] : [];
    const suggestions = selectedConversation ? AI_SUGGESTIONS[selectedConversation] ?? [] : [];

    function toggleStar(id: string) {
        setStarredIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

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
                            className={`flex-1 py-2.5 text-center text-xs font-medium transition-colors ${filterTab === tab.value
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
                        {filtered.length} conversations
                    </span>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <EmptyState icon={Inbox} title="No conversations yet" description="Start a campaign to begin receiving replies from leads." actionLabel="Create Campaign" actionHref="/campaigns/new" />
                    ) : (
                        filtered.map((convo) => (
                            <button
                                key={convo.id}
                                onClick={() => setSelectedConversation(convo.id)}
                                className={`w-full border-b border-white/4 px-4 py-3 text-left transition-colors ${selectedConversation === convo.id
                                    ? "bg-purple-500/10 border-l-2 border-l-purple-500"
                                    : "hover:bg-white/3"
                                    } ${convo.unreadCount > 0 ? "bg-white/[0.02]" : ""}`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-purple-700/20 text-sm font-medium text-purple-300">
                                            {convo.leadAvatar}
                                        </div>
                                        {convo.unreadCount > 0 && (
                                            <div className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
                                                {convo.unreadCount}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`text-sm truncate ${convo.unreadCount > 0
                                                    ? "font-semibold text-[var(--text-primary)]"
                                                    : "font-medium text-[var(--text-primary)]"
                                                    }`}
                                            >
                                                {convo.leadName}
                                            </span>
                                            <span className="ml-2 flex-shrink-0 text-[10px] text-[var(--text-muted)]">
                                                {convo.lastMessageAt}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)] truncate">
                                            {convo.leadTitle} at {convo.leadCompany}
                                        </p>
                                        <p
                                            className={`mt-1 text-xs truncate ${convo.unreadCount > 0
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
                                            {convo.sentiment && (
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[9px] px-1.5 py-0 ${SENTIMENT_STYLES[convo.sentiment].bg} ${SENTIMENT_STYLES[convo.sentiment].text}`}
                                                >
                                                    {SENTIMENT_STYLES[convo.sentiment].label}
                                                </Badge>
                                            )}
                                            {convo.campaignName && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[9px] px-1.5 py-0 border-white/10 text-[var(--text-muted)]"
                                                >
                                                    {convo.campaignName}
                                                </Badge>
                                            )}
                                            <div className="flex-1" />
                                            <Badge
                                                variant="outline"
                                                className="text-[9px] px-1 py-0 border-white/10 text-[var(--text-muted)]"
                                            >
                                                {convo.linkedinAccountAvatar}
                                            </Badge>
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
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-purple-700/20 text-sm font-medium text-purple-300">
                                {activeConvo.leadAvatar}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                                        {activeConvo.leadName}
                                    </h3>
                                    {activeConvo.sentiment && (
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] ${SENTIMENT_STYLES[activeConvo.sentiment].bg} ${SENTIMENT_STYLES[activeConvo.sentiment].text}`}
                                        >
                                            {SENTIMENT_STYLES[activeConvo.sentiment].label}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-[var(--text-muted)]">
                                    {activeConvo.leadTitle} at {activeConvo.leadCompany}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleStar(activeConvo.id)}
                                className={`h-8 w-8 p-0 ${starredIds.has(activeConvo.id)
                                    ? "text-amber-400"
                                    : "text-[var(--text-muted)] hover:text-amber-400"
                                    }`}
                                title="Star"
                            >
                                {starredIds.has(activeConvo.id) ? (
                                    <Star className="h-4 w-4 fill-current" />
                                ) : (
                                    <Star className="h-4 w-4" />
                                )}
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

                    {/* Note banner */}
                    {activeConvo.note && (
                        <div className="flex items-center gap-2 border-b border-white/6 bg-amber-500/5 px-6 py-2">
                            <StickyNote className="h-3.5 w-3.5 text-amber-400" />
                            <span className="text-xs text-amber-300">
                                {activeConvo.note}
                            </span>
                        </div>
                    )}

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
                        <div className="mx-auto max-w-2xl space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.direction === "sent"
                                        ? "justify-end"
                                        : "justify-start"
                                        }`}
                                >
                                    <div
                                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.direction === "sent"
                                            ? "bg-purple-500/20 text-[var(--text-primary)]"
                                            : "bg-white/5 text-[var(--text-primary)]"
                                            }`}
                                    >
                                        {msg.type === "connection_request" && (
                                            <div className="mb-1.5 flex items-center gap-1">
                                                <User className="h-3 w-3 text-blue-400" />
                                                <span className="text-[10px] font-medium text-blue-400">
                                                    Connection Request
                                                </span>
                                            </div>
                                        )}
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                            {msg.content}
                                        </p>
                                        <p
                                            className={`mt-1.5 text-[10px] ${msg.direction === "sent"
                                                ? "text-purple-300/60"
                                                : "text-[var(--text-muted)]"
                                                }`}
                                        >
                                            {msg.timestamp}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI suggestions */}
                    {showAiSuggestions && suggestions.length > 0 && (
                        <div className="border-t border-white/6 bg-purple-500/5 px-6 py-3">
                            <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                                    <span className="text-xs font-medium text-purple-300">
                                        AI Reply Suggestions
                                    </span>
                                    <Badge variant="outline" className="text-[9px] border-purple-500/30 bg-purple-500/10 text-purple-300">
                                        Powered by Claude
                                    </Badge>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsLoadingSuggestions(true);
                                        setTimeout(() => setIsLoadingSuggestions(false), 800);
                                    }}
                                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-purple-300 transition-colors hover:bg-purple-500/10"
                                >
                                    <RefreshCw className={`h-3 w-3 ${isLoadingSuggestions ? "animate-spin" : ""}`} />
                                    Regenerate
                                </button>
                            </div>
                            {isLoadingSuggestions ? (
                                <div className="space-y-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-10 animate-pulse rounded-lg bg-purple-500/10" />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {suggestions.map((suggestion, i) => (
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
                                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-purple-500/30 text-purple-300">
                                                    {suggestion.tone}
                                                </Badge>
                                            </div>
                                            <span className="text-xs text-[var(--text-secondary)]">{suggestion.text}</span>
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
                                    onChange={(e) => { setMessageInput(e.target.value); if (isAiDrafted) setIsAiDrafted(false); }}
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
                                                setIsLoadingSuggestions(true);
                                                setShowAiSuggestions(true);
                                                setTimeout(() => setIsLoadingSuggestions(false), 800);
                                            }
                                        }}
                                        className={`h-7 gap-1 px-2 text-xs ${showAiSuggestions
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
                                            className="border-purple-500/30 bg-purple-500/10 text-[10px] text-purple-300 gap-1"
                                        >
                                            <Sparkles className="h-2.5 w-2.5" />
                                            AI-drafted
                                        </Badge>
                                    )}
                                    <Badge
                                        variant="outline"
                                        className="border-white/10 text-[10px] text-[var(--text-muted)]"
                                    >
                                        via {activeConvo.linkedinAccountName}
                                    </Badge>
                                </div>
                            </div>
                            <Button
                                disabled={!messageInput.trim()}
                                className="h-10 w-10 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 p-0 text-white hover:from-purple-500 hover:to-purple-400 disabled:opacity-40"
                            >
                                <Send className="h-4 w-4" />
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
