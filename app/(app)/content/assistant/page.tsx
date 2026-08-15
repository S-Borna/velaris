// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import {
    BookOpen,
    Calendar,
    Clock,
    Copy,
    FileText,
    Hash,
    Heart,
    Layout,
    Loader2,
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
    generatedContent: string | null;
    topic: string | null;
    category: string | null;
    status: string;
    scheduledAt: string | null;
    postedAt: string | null;
    createdAt: string;
}

interface ScheduledPost {
    id: string;
    generatedContent: string | null;
    scheduledAt: string | null;
    status: string;
    linkedinAccountId: string | null;
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

/* ─── Component ─────────────────────────────────────── */

/**
 * Content Assistant — AI-powered LinkedIn content generation.
 * Create tab calls real /api/content/generate.
 * Library + Schedule tabs fetch from /api/content-posts.
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

    // Library + schedule from API
    const [libraryPosts, setLibraryPosts] = useState<LibraryPost[]>([]);
    const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
    const [loadingLibrary, setLoadingLibrary] = useState(false);
    const [loadingSchedule, setLoadingSchedule] = useState(false);

    /* ── Fetch library ──────────────── */

    const fetchLibrary = useCallback(async () => {
        setLoadingLibrary(true);
        try {
            const res = await fetch("/api/content-posts?pageSize=50");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            setLibraryPosts(json.data?.data ?? []);
        } catch {
            setLibraryPosts([]);
        } finally {
            setLoadingLibrary(false);
        }
    }, []);

    const fetchScheduled = useCallback(async () => {
        setLoadingSchedule(true);
        try {
            const res = await fetch("/api/content-posts?status=scheduled&pageSize=50");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            setScheduledPosts(json.data?.data ?? []);
        } catch {
            setScheduledPosts([]);
        } finally {
            setLoadingSchedule(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "library") fetchLibrary();
        if (activeTab === "schedule") {
            fetchScheduled();
            fetchLibrary();
        }
    }, [activeTab, fetchLibrary, fetchScheduled]);

    /* ── Generate ──────────────────── */

    async function handleGenerate(): Promise<void> {
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
                `${data.variants.length} variants generated (${data.tokensUsed} tokens used)`,
            );

            // Save each variant to DB
            for (const variant of data.variants) {
                await fetch("/api/content-posts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        category,
                        topic: topic.trim(),
                        targetAudience: audience.trim(),
                        language,
                        tone,
                        generatedContent: variant.content,
                        status: "draft",
                    }),
                });
            }
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to generate content";
            toast.error(message);
        } finally {
            setIsGenerating(false);
        }
    }

    function handleCopy(text: string): void {
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

    function formatDate(iso: string | null): string {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

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
                            className={`gap-1.5 ${
                                activeTab === tab.value
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
                                    options={CATEGORY_OPTIONS.map((opt) => ({
                                        label: opt,
                                        value: opt,
                                    }))}
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
                                    options={LANGUAGE_OPTIONS.map((opt) => ({
                                        label: opt,
                                        value: opt,
                                    }))}
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
                                            className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                                                tone === opt.value
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
                                className="w-full gap-2 bg-purple-600 py-5 text-white hover:bg-purple-500 disabled:opacity-50"
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
                                <div className="mb-2 flex items-center gap-2">
                                    <Wand2 className="h-3.5 w-3.5 text-purple-400" />
                                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                                        Brand Voice Training
                                    </span>
                                    {voiceTrained && (
                                        <Badge
                                            variant="outline"
                                            className="border-green-500/30 bg-green-500/15 text-[9px] text-green-300"
                                        >
                                            Trained
                                        </Badge>
                                    )}
                                </div>
                                <p className="mb-3 text-xs text-[var(--text-muted)]">
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
                                        const filledSamples = brandVoiceSamples.filter(
                                            (s) => s.trim().length > 0,
                                        );
                                        if (filledSamples.length === 0) return;
                                        setIsTrainingVoice(true);
                                        setTimeout(() => {
                                            setIsTrainingVoice(false);
                                            setVoiceTrained(true);
                                            toast.success(
                                                `Brand voice trained on ${filledSamples.length} sample${filledSamples.length > 1 ? "s" : ""}. Next generation will match your style.`,
                                            );
                                        }, 800);
                                    }}
                                    disabled={
                                        isTrainingVoice ||
                                        brandVoiceSamples.every((s) => s.trim() === "")
                                    }
                                    size="sm"
                                    className="mt-2 w-full gap-1.5 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 disabled:opacity-40"
                                >
                                    <Wand2
                                        className={`h-3 w-3 ${isTrainingVoice ? "animate-spin" : ""}`}
                                    />
                                    {isTrainingVoice
                                        ? "Training..."
                                        : voiceTrained
                                          ? "Retrain Voice"
                                          : "Train Voice"}
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
                                            className={`gap-1.5 ${
                                                selectedVariant === post.id
                                                    ? "border-purple-500/40 bg-purple-500/15 text-purple-300"
                                                    : "border-white/10 bg-white/5 text-[var(--text-secondary)]"
                                            }`}
                                        >
                                            Variant {post.variant}
                                            <Badge
                                                variant="outline"
                                                className={`text-[9px] ${
                                                    post.hookScore >= 90
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
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600/25 text-sm font-bold text-purple-300">
                                                    SB
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                        Said Borna
                                                    </p>
                                                    <p className="text-xs text-[var(--text-muted)]">
                                                        Building Velaris · AI-powered LinkedIn
                                                        automation
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
                                                        {
                                                            icon: MessageCircle,
                                                            label: "Comment",
                                                        },
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
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative flex h-16 w-16 items-center justify-center">
                                                            <svg
                                                                className="h-16 w-16 -rotate-90"
                                                                viewBox="0 0 36 36"
                                                            >
                                                                <path
                                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                    fill="none"
                                                                    stroke="rgba(255,255,255,0.08)"
                                                                    strokeWidth="3"
                                                                />
                                                                <path
                                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                    fill="none"
                                                                    stroke={
                                                                        selectedPost.hookScore >=
                                                                        85
                                                                            ? "#22c55e"
                                                                            : selectedPost.hookScore >=
                                                                                70
                                                                              ? "#eab308"
                                                                              : "#ef4444"
                                                                    }
                                                                    strokeWidth="3"
                                                                    strokeDasharray={`${selectedPost.hookScore}, 100`}
                                                                    strokeLinecap="round"
                                                                    className="transition-all duration-700"
                                                                />
                                                            </svg>
                                                            <span className="absolute text-sm font-bold text-[var(--text-primary)]">
                                                                {selectedPost.hookScore}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-[var(--text-primary)]">
                                                                Hook Score
                                                            </p>
                                                            <p className="text-xs text-[var(--text-muted)]">
                                                                {selectedPost.hookScore >= 85
                                                                    ? "Strong viral potential"
                                                                    : selectedPost.hookScore >=
                                                                        70
                                                                      ? "Good engagement expected"
                                                                      : "Consider improving the hook"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-[var(--text-secondary)]">
                                                            Predicted Reach
                                                        </span>
                                                        <span className="text-sm font-medium text-[var(--text-primary)]">
                                                            {selectedPost.predictedReach}{" "}
                                                            impressions
                                                        </span>
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
                                                            className="cursor-pointer border-blue-500/20 bg-blue-500/10 text-xs text-blue-300 hover:bg-blue-500/20"
                                                        >
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-3">
                                                <Button
                                                    onClick={() =>
                                                        handleCopy(selectedPost.content)
                                                    }
                                                    variant="outline"
                                                    className="flex-1 gap-1.5 border-white/10 bg-white/5 text-[var(--text-secondary)] hover:bg-white/10"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                    {copied ? "Copied!" : "Copy"}
                                                </Button>
                                                <Button className="flex-1 gap-1.5 bg-purple-600 text-white hover:bg-purple-500">
                                                    <Calendar className="h-4 w-4" />
                                                    Schedule Post
                                                </Button>
                                            </div>

                                            {/* Carousel teaser */}
                                            <div className="rounded-xl border border-white/6 bg-white/3 p-3">
                                                <div className="mb-1 flex items-center gap-2">
                                                    <Layout className="h-3.5 w-3.5 text-purple-400" />
                                                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                                                        Carousel Creator
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className="border-amber-500/30 bg-amber-500/15 text-[9px] text-amber-300"
                                                    >
                                                        Coming Soon
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    Convert this post into a slide carousel for
                                                    higher engagement
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
                    {loadingLibrary ? (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-20 animate-pulse rounded-xl bg-white/5"
                                />
                            ))}
                        </div>
                    ) : libraryPosts.length === 0 ? (
                        <div className="flex h-64 items-center justify-center text-sm text-[var(--text-muted)]">
                            No content yet. Generate your first post using the Create tab.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {libraryPosts.map((post) => (
                                <div
                                    key={post.id}
                                    className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-4 transition-colors hover:border-white/10"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-2 flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${
                                                        post.status === "posted"
                                                            ? "border-green-500/30 bg-green-500/15 text-green-300"
                                                            : post.status === "scheduled"
                                                              ? "border-blue-500/30 bg-blue-500/15 text-blue-300"
                                                              : "border-white/10 bg-white/5 text-[var(--text-muted)]"
                                                    }`}
                                                >
                                                    {post.status.charAt(0).toUpperCase() +
                                                        post.status.slice(1)}
                                                </Badge>
                                                {post.category && (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-white/10 text-[10px] text-[var(--text-muted)]"
                                                    >
                                                        {post.category}
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-[var(--text-muted)]">
                                                    {formatDate(post.createdAt)}
                                                </span>
                                            </div>
                                            <p className="line-clamp-2 text-sm text-[var(--text-primary)]">
                                                {post.generatedContent ?? post.topic ?? "—"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ─── Schedule tab ─── */}
            {activeTab === "schedule" && (
                <div className="flex-1 overflow-y-auto p-6">
                    {loadingSchedule ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-20 animate-pulse rounded-xl bg-white/5"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Scheduled */}
                            <div>
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                                    <Clock className="h-4 w-4 text-blue-400" />
                                    Scheduled ({scheduledPosts.length})
                                </h3>
                                {scheduledPosts.length === 0 ? (
                                    <div className="flex h-32 items-center justify-center rounded-xl border border-white/6 bg-[var(--bg-card)] text-xs text-[var(--text-muted)]">
                                        No scheduled posts
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {scheduledPosts.map((post) => (
                                            <div
                                                key={post.id}
                                                className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-4"
                                            >
                                                <div className="mb-2 flex items-center gap-2">
                                                    <Calendar className="h-3 w-3 text-blue-400" />
                                                    <span className="text-[10px] text-[var(--text-muted)]">
                                                        {formatDate(post.scheduledAt)}
                                                    </span>
                                                </div>
                                                <p className="line-clamp-2 text-sm text-[var(--text-primary)]">
                                                    {post.generatedContent ?? "—"}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Recently posted */}
                            <div>
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                                    <FileText className="h-4 w-4 text-green-400" />
                                    All Posts (
                                    {libraryPosts.filter((p) => p.status === "posted").length})
                                </h3>
                                <div className="space-y-3">
                                    {libraryPosts
                                        .filter((p) => p.status === "posted")
                                        .map((post) => (
                                            <div
                                                key={post.id}
                                                className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-4"
                                            >
                                                <div className="mb-2 flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="border-green-500/30 bg-green-500/15 text-xs text-green-300"
                                                    >
                                                        Posted
                                                    </Badge>
                                                    <span className="text-[10px] text-[var(--text-muted)]">
                                                        {formatDate(post.postedAt)}
                                                    </span>
                                                </div>
                                                <p className="line-clamp-2 text-sm text-[var(--text-primary)]">
                                                    {post.generatedContent ?? "—"}
                                                </p>
                                            </div>
                                        ))}
                                    {libraryPosts.filter((p) => p.status === "posted")
                                        .length === 0 && (
                                        <div className="flex h-32 items-center justify-center rounded-xl border border-white/6 bg-[var(--bg-card)] text-xs text-[var(--text-muted)]">
                                            No posted content yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
