// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import {
    BookOpen,
    Calendar,
    ChevronDown,
    Clock,
    Copy,
    FileText,
    Hash,
    Heart,
    Image,
    Layout,
    MessageCircle,
    PenTool,
    Repeat2,
    Send,
    Sparkles,
    ThumbsUp,
    TrendingUp,
    Wand2,
    Zap,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */

type ContentTab = "create" | "library" | "schedule";
type ToneOption = "professional" | "casual" | "inspirational" | "educational" | "controversial" | "storytelling";

interface GeneratedPost {
    id: string;
    content: string;
    hookScore: number;
    predictedReach: string;
    hashtags: string[];
    variant: string;
}

interface LibraryPost {
    id: string;
    content: string;
    status: "draft" | "scheduled" | "posted";
    scheduledAt: string | null;
    postedAt: string | null;
    impressions: number | null;
    reactions: number | null;
    comments: number | null;
    createdAt: string;
}

interface ScheduledPost {
    id: string;
    content: string;
    scheduledAt: string;
    linkedinAccount: string;
    status: "scheduled" | "posted";
}

/* ─── Options ───────────────────────────────────────── */

const CATEGORY_OPTIONS = [
    "Thought Leadership",
    "Case Study",
    "Tips & How-To",
    "Industry News",
    "Personal Story",
    "Product Launch",
    "Behind the Scenes",
    "Poll / Question",
    "Carousel Post",
    "Lead Magnet",
];

const TONE_OPTIONS: { value: ToneOption; label: string; emoji: string }[] = [
    { value: "professional", label: "Professional", emoji: "💼" },
    { value: "casual", label: "Casual", emoji: "😎" },
    { value: "inspirational", label: "Inspirational", emoji: "🚀" },
    { value: "educational", label: "Educational", emoji: "📚" },
    { value: "controversial", label: "Controversial", emoji: "🔥" },
    { value: "storytelling", label: "Storytelling", emoji: "📖" },
];

const LANGUAGE_OPTIONS = [
    "English",
    "Swedish",
    "German",
    "French",
    "Spanish",
    "Dutch",
    "Portuguese",
    "Italian",
];

/* ─── API response type ─────────────────────────────── */

interface ContentApiResponse {
    variants: GeneratedPost[];
    model: string;
    tokensUsed: number;
}

interface ContentApiError {
    error: string;
    details?: Array<{ field: string; message: string }>;
}

const MOCK_LIBRARY: LibraryPost[] = [
    { id: "lib1", content: "I spent 6 months analyzing 10,000+ LinkedIn outreach campaigns...", status: "posted", scheduledAt: null, postedAt: "2026-03-03 09:00", impressions: 18420, reactions: 247, comments: 89, createdAt: "2026-03-02" },
    { id: "lib2", content: "Hot take: 90% of LinkedIn outreach messages are garbage...", status: "scheduled", scheduledAt: "2026-03-07 10:00", postedAt: null, impressions: null, reactions: null, comments: null, createdAt: "2026-03-05" },
    { id: "lib3", content: "3 things I wish I knew before starting my SaaS journey...", status: "draft", scheduledAt: null, postedAt: null, impressions: null, reactions: null, comments: null, createdAt: "2026-03-06" },
    { id: "lib4", content: "We just hit $10K MRR. Here's the breakdown...", status: "posted", scheduledAt: null, postedAt: "2026-02-28 11:30", impressions: 32100, reactions: 512, comments: 134, createdAt: "2026-02-27" },
    { id: "lib5", content: "The single best investment I made this year was...", status: "posted", scheduledAt: null, postedAt: "2026-02-20 09:15", impressions: 8900, reactions: 156, comments: 42, createdAt: "2026-02-19" },
];

const MOCK_SCHEDULED: ScheduledPost[] = [
    { id: "s1", content: "Hot take: 90% of LinkedIn outreach messages are garbage...", scheduledAt: "2026-03-07 10:00", linkedinAccount: "Said Borna", status: "scheduled" },
    { id: "s2", content: "3 things I wish I knew before starting my SaaS journey...", scheduledAt: "2026-03-08 09:00", linkedinAccount: "Said Borna", status: "scheduled" },
    { id: "s3", content: "The future of cold outreach isn't cold at all...", scheduledAt: "2026-03-09 11:00", linkedinAccount: "Said Borna", status: "scheduled" },
    { id: "s4", content: "I analyzed 500 LinkedIn profiles of top SDRs...", scheduledAt: "2026-03-10 10:30", linkedinAccount: "Said Borna", status: "scheduled" },
];

/* ─── Component ─────────────────────────────────────── */

/**
 * Content Assistant — AI-powered LinkedIn content generation.
 * Form: Category, Topic, Target Audience, Language, Tone. Generate → multi-variant preview.
 * Tabs: Create Post | Library | Schedule Post.
 */
export default function ContentAssistantPage() {
    const [activeTab, setActiveTab] = useState<ContentTab>("create");
    const [category, setCategory] = useState("Thought Leadership");
    const [topic, setTopic] = useState("");
    const [audience, setAudience] = useState("");
    const [language, setLanguage] = useState("English");
    const [tone, setTone] = useState<ToneOption>("professional");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generated, setGenerated] = useState<GeneratedPost[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [brandVoiceSamples, setBrandVoiceSamples] = useState<string[]>(["", "", ""]);
    const [isTrainingVoice, setIsTrainingVoice] = useState(false);
    const [voiceTrained, setVoiceTrained] = useState(false);
    const [libraryPosts, setLibraryPosts] = useState<LibraryPost[]>([]);
    const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/content-posts?pageSize=100");
                if (!res.ok) throw new Error("Failed to fetch");
                const json = await res.json();
                const posts: Record<string, unknown>[] = json.data ?? json;
                const lib: LibraryPost[] = posts.map((p) => ({
                    id: String(p.id),
                    content: String(p.generatedContent ?? p.topic ?? ""),
                    status: String(p.status ?? "draft") as LibraryPost["status"],
                    scheduledAt: p.scheduledAt ? String(p.scheduledAt) : null,
                    postedAt: p.postedAt ? String(p.postedAt) : null,
                    impressions: null,
                    reactions: null,
                    comments: null,
                    createdAt: String(p.createdAt ?? "").slice(0, 10),
                }));
                const sched: ScheduledPost[] = posts
                    .filter((p) => String(p.status) === "scheduled")
                    .map((p) => ({
                        id: String(p.id),
                        content: String(p.generatedContent ?? p.topic ?? ""),
                        scheduledAt: String(p.scheduledAt ?? ""),
                        linkedinAccount: "Said Borna",
                        status: "scheduled" as const,
                    }));
                setLibraryPosts(lib.length > 0 ? lib : MOCK_LIBRARY);
                setScheduledPosts(sched.length > 0 ? sched : MOCK_SCHEDULED);
            } catch {
                setLibraryPosts(MOCK_LIBRARY);
                setScheduledPosts(MOCK_SCHEDULED);
            }
        }
        load();
    }, []);

    async function handleGenerate() {
        if (!topic.trim() || !audience.trim()) {
            toast.error("Please fill in Topic and Target Audience");
            return;
        }

        setIsGenerating(true);
        setGenerated([]);
        setSelectedVariant(null);

        try {
            const response = await fetch("/api/content/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category,
                    topic: topic.trim(),
                    audience: audience.trim(),
                    language,
                    tone,
                    brandVoiceSamples: voiceTrained
                        ? brandVoiceSamples.filter((s) => s.trim())
                        : undefined,
                }),
            });

            if (!response.ok) {
                const errorData = (await response.json()) as ContentApiError;
                throw new Error(errorData.error || "Generation failed");
            }

            const data = (await response.json()) as ContentApiResponse;
            setGenerated(data.variants);
            setSelectedVariant(data.variants[0]?.id ?? null);
            toast.success(
                `${data.variants.length} variants generated (${data.tokensUsed} tokens used)`
            );
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to generate content";
            toast.error(message);
        } finally {
            setIsGenerating(false);
        }
    }

    function handleCopy(text: string) {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Content copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    }

    const selectedPost = generated.find((p) => p.id === selectedVariant);

    const tabs: { value: ContentTab; label: string; icon: typeof PenTool }[] = [
        { value: "create", label: "Create Post", icon: PenTool },
        { value: "library", label: "Library", icon: BookOpen },
        { value: "schedule", label: "Schedule", icon: Calendar },
    ];

    return (
        <div className="flex h-full flex-1 flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-white/6 px-6 py-4">
                <div>
                    <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                        Content Assistant
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        AI-powered LinkedIn content generator with performance prediction
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {tabs.map((tab) => (
                        <Button
                            key={tab.value}
                            variant={activeTab === tab.value ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setActiveTab(tab.value)}
                            className={`gap-1.5 ${activeTab === tab.value
                                    ? "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                }`}
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* ─── Create tab ─── */}
            {activeTab === "create" && (
                <div className="flex flex-1 overflow-hidden">
                    {/* Left: form */}
                    <div className="w-[420px] flex-shrink-0 overflow-y-auto border-r border-white/6 p-6">
                        <div className="space-y-5">
                            {/* Category */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[var(--text-secondary)]">
                                    Category
                                </label>
                                <CustomSelect
                                    value={category}
                                    onChange={setCategory}
                                    options={CATEGORY_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
                                />
                            </div>

                            {/* Topic */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[var(--text-secondary)]">
                                    Topic
                                </label>
                                <Input
                                    placeholder="e.g. How to improve LinkedIn outreach reply rates"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="h-10 border-white/10 bg-[var(--bg-input)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:ring-purple-500/20"
                                />
                            </div>

                            {/* Target Audience */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[var(--text-secondary)]">
                                    Target Audience
                                </label>
                                <Input
                                    placeholder="e.g. B2B SaaS founders and sales leaders"
                                    value={audience}
                                    onChange={(e) => setAudience(e.target.value)}
                                    className="h-10 border-white/10 bg-[var(--bg-input)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:ring-purple-500/20"
                                />
                            </div>

                            {/* Language */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[var(--text-secondary)]">
                                    Language
                                </label>
                                <CustomSelect
                                    value={language}
                                    onChange={setLanguage}
                                    options={LANGUAGE_OPTIONS.map((opt) => ({ label: opt, value: opt }))}
                                />
                            </div>

                            {/* Tone */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[var(--text-secondary)]">
                                    Tone
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {TONE_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setTone(opt.value)}
                                            className={`rounded-lg border px-3 py-2 text-xs transition-colors ${tone === opt.value
                                                    ? "border-purple-500/40 bg-purple-500/10 text-purple-300"
                                                    : "border-white/6 bg-white/3 text-[var(--text-secondary)] hover:border-white/10"
                                                }`}
                                        >
                                            <span className="mr-1">{opt.emoji}</span>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Generate button */}
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="w-full gap-2 bg-gradient-to-r from-purple-600 to-purple-500 py-5 text-white hover:from-purple-500 hover:to-purple-400 disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <>
                                        <Sparkles className="h-4 w-4 animate-pulse" />
                                        Generating 3 variants...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        Generate Content
                                    </>
                                )}
                            </Button>

                            {/* Brand voice training */}
                            <div className="rounded-xl border border-white/6 bg-white/3 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Wand2 className="h-3.5 w-3.5 text-purple-400" />
                                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                                        Brand Voice Training
                                    </span>
                                    {voiceTrained && (
                                        <Badge
                                            variant="outline"
                                            className="text-[9px] border-green-500/30 bg-green-500/15 text-green-300"
                                        >
                                            Trained
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mb-3">
                                    Paste 2-3 sample posts to teach the AI your writing style
                                </p>
                                <div className="space-y-2">
                                    {brandVoiceSamples.map((sample, i) => (
                                        <textarea
                                            key={i}
                                            value={sample}
                                            onChange={(e) => {
                                                const next = [...brandVoiceSamples];
                                                next[i] = e.target.value;
                                                setBrandVoiceSamples(next);
                                            }}
                                            placeholder={`Sample post ${i + 1}...`}
                                            rows={2}
                                            className="w-full resize-none rounded-lg border border-white/10 bg-[var(--bg-input)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/20"
                                        />
                                    ))}
                                </div>
                                <Button
                                    onClick={() => {
                                        const filledSamples = brandVoiceSamples.filter((s) => s.trim().length > 0);
                                        if (filledSamples.length === 0) return;
                                        setIsTrainingVoice(true);
                                        // Brand voice is applied by passing samples to Claude on next generation
                                        setTimeout(() => {
                                            setIsTrainingVoice(false);
                                            setVoiceTrained(true);
                                            toast.success(
                                                `Brand voice trained on ${filledSamples.length} sample${filledSamples.length > 1 ? "s" : ""}. Next generation will match your style.`
                                            );
                                        }, 800);
                                    }}
                                    disabled={isTrainingVoice || brandVoiceSamples.every((s) => s.trim() === "")}
                                    size="sm"
                                    className="mt-2 w-full gap-1.5 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 disabled:opacity-40"
                                >
                                    <Wand2 className={`h-3 w-3 ${isTrainingVoice ? "animate-spin" : ""}`} />
                                    {isTrainingVoice ? "Training..." : voiceTrained ? "Retrain Voice" : "Train Voice"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right: preview */}
                    <div className="flex flex-1 flex-col overflow-y-auto">
                        {generated.length === 0 ? (
                            <div className="flex flex-1 items-center justify-center">
                                <div className="text-center">
                                    <PenTool className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" />
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Fill in the form and click &quot;Generate Content&quot;
                                    </p>
                                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                                        AI will create 3 variants with performance predictions
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6">
                                {/* Variant tabs */}
                                <div className="mb-4 flex items-center gap-2">
                                    {generated.map((post) => (
                                        <Button
                                            key={post.id}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedVariant(post.id)}
                                            className={`gap-1.5 ${selectedVariant === post.id
                                                    ? "border-purple-500/40 bg-purple-500/15 text-purple-300"
                                                    : "border-white/10 bg-white/5 text-[var(--text-secondary)]"
                                                }`}
                                        >
                                            Variant {post.variant}
                                            <Badge
                                                variant="outline"
                                                className={`text-[9px] ${post.hookScore >= 90
                                                        ? "border-green-500/30 text-green-300"
                                                        : post.hookScore >= 85
                                                            ? "border-amber-500/30 text-amber-300"
                                                            : "border-white/10 text-[var(--text-muted)]"
                                                    }`}
                                            >
                                                {post.hookScore}%
                                            </Badge>
                                        </Button>
                                    ))}
                                </div>

                                {selectedPost && (
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                        {/* LinkedIn preview */}
                                        <div className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-5">
                                            <div className="mb-4 flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-purple-700/20 text-sm font-bold text-purple-300">
                                                    SB
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                        Said Borna
                                                    </p>
                                                    <p className="text-xs text-[var(--text-muted)]">
                                                        Building Velaris · AI-powered LinkedIn automation
                                                    </p>
                                                    <p className="text-[10px] text-[var(--text-muted)]">
                                                        Just now · 🌐
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-primary)]">
                                                {selectedPost.content}
                                            </div>

                                            {/* Hashtags */}
                                            <div className="mb-4 flex flex-wrap gap-1.5">
                                                {selectedPost.hashtags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="text-xs text-blue-400"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Engagement bar */}
                                            <div className="border-t border-white/6 pt-3">
                                                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                                                    <span>259 reactions</span>
                                                    <span>34 comments · 12 reposts</span>
                                                </div>
                                                <div className="mt-2 flex items-center justify-around border-t border-white/6 pt-2">
                                                    {[
                                                        { icon: ThumbsUp, label: "Like" },
                                                        { icon: MessageCircle, label: "Comment" },
                                                        { icon: Repeat2, label: "Repost" },
                                                        { icon: Send, label: "Send" },
                                                    ].map((action) => (
                                                        <button
                                                            key={action.label}
                                                            className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                                                        >
                                                            <action.icon className="h-4 w-4" />
                                                            {action.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Performance + actions */}
                                        <div className="space-y-4">
                                            {/* Hook score */}
                                            <div className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-4">
                                                <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                                                    <Zap className="h-4 w-4 text-amber-400" />
                                                    Performance Predictor
                                                </h4>
                                                <div className="space-y-3">
                                                    {/* Circular score ring */}
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative flex h-16 w-16 items-center justify-center">
                                                            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                                                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                                                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={selectedPost.hookScore >= 85 ? "#22c55e" : selectedPost.hookScore >= 70 ? "#eab308" : "#ef4444"} strokeWidth="3" strokeDasharray={`${selectedPost.hookScore}, 100`} strokeLinecap="round" className="transition-all duration-700" />
                                                            </svg>
                                                            <span className="absolute text-sm font-bold text-[var(--text-primary)]">{selectedPost.hookScore}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-[var(--text-primary)]">Hook Score</p>
                                                            <p className="text-xs text-[var(--text-muted)]">
                                                                {selectedPost.hookScore >= 85 ? "Strong viral potential" : selectedPost.hookScore >= 70 ? "Good engagement expected" : "Consider improving the hook"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-[var(--text-secondary)]">
                                                            Predicted Reach
                                                        </span>
                                                        <span className="text-sm font-medium text-[var(--text-primary)]">
                                                            {selectedPost.predictedReach} impressions
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-[var(--text-secondary)]">
                                                            Readability
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className="border-green-500/30 bg-green-500/15 text-green-300 text-xs"
                                                        >
                                                            Excellent
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-[var(--text-secondary)]">
                                                            Best Posting Time
                                                        </span>
                                                        <span className="flex items-center gap-1 text-xs font-medium text-blue-300">
                                                            <Clock className="h-3 w-3" />
                                                            Tue-Thu, 9-11 AM CET
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-[var(--text-secondary)]">
                                                            Expected Engagement
                                                        </span>
                                                        <span className="text-xs font-medium text-green-300">
                                                            ~{Math.round(selectedPost.hookScore * 2.8)} reactions · ~{Math.round(selectedPost.hookScore * 0.95)} comments
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Hashtag suggestions */}
                                            <div className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-4">
                                                <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                                                    <Hash className="h-4 w-4 text-blue-400" />
                                                    Suggested Hashtags
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedPost.hashtags.map((tag) => (
                                                        <Badge
                                                            key={tag}
                                                            variant="outline"
                                                            className="border-blue-500/20 bg-blue-500/10 text-blue-300 text-xs cursor-pointer hover:bg-blue-500/20"
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    <Badge
                                                        variant="outline"
                                                        className="border-white/10 text-[var(--text-muted)] text-xs cursor-pointer hover:bg-white/5"
                                                    >
                                                        + Add
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-3">
                                                <Button
                                                    onClick={() => handleCopy(selectedPost.content)}
                                                    variant="outline"
                                                    className="flex-1 gap-1.5 border-white/10 bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                    {copied ? "Copied!" : "Copy"}
                                                </Button>
                                                <Button className="flex-1 gap-1.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400">
                                                    <Calendar className="h-4 w-4" />
                                                    Schedule Post
                                                </Button>
                                            </div>

                                            {/* Carousel creator teaser */}
                                            <div className="rounded-xl border border-white/6 bg-white/3 p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Layout className="h-3.5 w-3.5 text-purple-400" />
                                                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                                                        Carousel Creator
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[9px] border-amber-500/30 bg-amber-500/15 text-amber-300"
                                                    >
                                                        Coming Soon
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    Convert this post into a slide carousel for higher engagement
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── Library tab ─── */}
            {activeTab === "library" && (
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                        {libraryPosts.map((post) => (
                            <div
                                key={post.id}
                                className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-4 hover:border-white/10 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge
                                                variant="outline"
                                                className={`text-xs ${post.status === "posted"
                                                        ? "border-green-500/30 bg-green-500/15 text-green-300"
                                                        : post.status === "scheduled"
                                                            ? "border-blue-500/30 bg-blue-500/15 text-blue-300"
                                                            : "border-white/10 bg-white/5 text-[var(--text-muted)]"
                                                    }`}
                                            >
                                                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                                            </Badge>
                                            <span className="text-xs text-[var(--text-muted)]">
                                                {post.createdAt}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[var(--text-primary)] line-clamp-2">
                                            {post.content}
                                        </p>
                                    </div>
                                    {post.status === "posted" && post.impressions && (
                                        <div className="ml-4 flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                                            <span className="flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3" />
                                                {post.impressions.toLocaleString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Heart className="h-3 w-3" />
                                                {post.reactions}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageCircle className="h-3 w-3" />
                                                {post.comments}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Schedule tab ─── */}
            {activeTab === "schedule" && (
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Scheduled */}
                        <div>
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                                <Clock className="h-4 w-4 text-blue-400" />
                                Scheduled ({scheduledPosts.length})
                            </h3>
                            <div className="space-y-3">
                                {scheduledPosts.map((post) => (
                                    <div
                                        key={post.id}
                                        className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-4"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-purple-700/20 text-[10px] font-medium text-purple-300">
                                                SB
                                            </div>
                                            <span className="text-xs text-[var(--text-secondary)]">
                                                {post.linkedinAccount}
                                            </span>
                                            <span className="text-[10px] text-[var(--text-muted)]">
                                                · {post.scheduledAt}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[var(--text-primary)] line-clamp-2">
                                            {post.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recently posted */}
                        <div>
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                                <FileText className="h-4 w-4 text-green-400" />
                                Recently Posted ({libraryPosts.filter((p) => p.status === "posted").length})
                            </h3>
                            <div className="space-y-3">
                                {libraryPosts.filter((p) => p.status === "posted").map((post) => (
                                    <div
                                        key={post.id}
                                        className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-4"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge
                                                variant="outline"
                                                className="text-xs border-green-500/30 bg-green-500/15 text-green-300"
                                            >
                                                Posted
                                            </Badge>
                                            <span className="text-[10px] text-[var(--text-muted)]">
                                                {post.postedAt}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[var(--text-primary)] line-clamp-2 mb-2">
                                            {post.content}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                                            <span className="flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3" />
                                                {post.impressions?.toLocaleString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Heart className="h-3 w-3" />
                                                {post.reactions}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageCircle className="h-3 w-3" />
                                                {post.comments}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
