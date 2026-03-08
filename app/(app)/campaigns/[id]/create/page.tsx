// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, FileText, Settings, X } from "lucide-react";
import { SequenceBuilder } from "@/components/campaigns/sequence-builder";
import type { SequenceNode, NodeType } from "@/components/campaigns/sequence-builder";
import { toast } from "sonner";

type TabKey = "analytics" | "leads" | "sequences" | "schedule" | "accounts";

const TABS: { key: TabKey; label: string }[] = [
    { key: "analytics", label: "Analytics" },
    { key: "leads", label: "Leads" },
    { key: "sequences", label: "Sequences" },
    { key: "schedule", label: "Schedule" },
    { key: "accounts", label: "LinkedIn Accounts" },
];

interface SequenceTemplate {
    id: string;
    name: string;
    description: string;
    steps: string[];
    replyRate: string;
    category: string;
}

const SEQUENCE_TEMPLATES: SequenceTemplate[] = [
    { id: "t1", name: "Classic Outreach", description: "Standard connection request → follow-up sequence for B2B sales.", steps: ["View Profile", "Send Connection", "Wait 2d", "Send Message", "Wait 3d", "Follow-up"], replyRate: "18-24%", category: "Outreach" },
    { id: "t2", name: "Warm Engagement First", description: "Engage with content before reaching out — higher acceptance rates.", steps: ["View Profile", "Like Post", "Wait 1d", "Send Connection", "Wait 2d", "Send Message"], replyRate: "25-32%", category: "Engagement" },
    { id: "t3", name: "ICP Qualifier", description: "Score leads with AI before sending connection — only reach qualified prospects.", steps: ["ICP Score ≥ 70", "View Profile", "Send Connection", "Wait 2d", "Send Message", "Wait 3d", "Follow-up"], replyRate: "28-35%", category: "AI-Powered" },
    { id: "t4", name: "Multi-Touch Nurture", description: "Long-form nurture sequence with multiple value touchpoints.", steps: ["Send Connection", "Wait 3d", "Send Message", "Wait 5d", "Like Post", "Wait 2d", "Follow-up", "Wait 5d", "Final Follow-up"], replyRate: "20-28%", category: "Nurture" },
    { id: "t5", name: "Event-Based Outreach", description: "Leverage shared events or webinars for warm introductions.", steps: ["View Profile", "Send Connection (event note)", "Wait 1d", "Send Message", "Wait 2d", "Voice Note"], replyRate: "30-40%", category: "Events" },
];

/** Map from template step label to NodeType */
const STEP_TYPE_MAP: Record<string, NodeType> = {
    "View Profile": "view_profile",
    "Send Connection": "connect",
    "Send Connection (event note)": "connect",
    "Send Message": "message",
    "Follow-up": "message",
    "Final Follow-up": "message",
    "Like Post": "like_post",
    "Voice Note": "voice_note",
    "ICP Score ≥ 70": "condition",
};

const WAIT_PATTERN = /^Wait (\d+)d$/;

interface ApiSequenceStep {
    stepOrder: number;
    actionType: string;
    messageTemplate: string | null;
    waitDays: number | null;
    conditionType: string | null;
    conditionValue: string | null;
}

/** Convert flat API steps to the tree-based SequenceNode format */
function apiStepsToNodes(steps: ApiSequenceStep[]): SequenceNode[] {
    if (steps.length === 0) return [];
    const sorted = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
    const nodes: SequenceNode[] = [];
    let counter = 0;

    // Start node
    counter += 1;
    const startId = `n${counter}`;
    nodes.push({ id: startId, type: "start", label: "Campaign Started", config: {}, children: [] });

    let prevId = startId;
    for (const step of sorted) {
        counter += 1;
        const nodeId = `n${counter}`;
        const nodeType = step.actionType as NodeType;
        const palette = [
            { type: "connect", label: "Send Connection" },
            { type: "message", label: "Send Message" },
            { type: "follow_up", label: "Follow-up" },
            { type: "voice_note", label: "Voice Note" },
            { type: "view_profile", label: "View Profile" },
            { type: "like_post", label: "Like Post" },
            { type: "wait", label: "Wait" },
            { type: "condition", label: "Condition" },
        ];
        const match = palette.find((p) => p.type === nodeType);
        let label = match?.label ?? nodeType;

        const config: Record<string, string> = {};
        if (nodeType === "wait") {
            const days = String(step.waitDays ?? 1);
            config.days = days;
            label = `Wait ${days} day${days === "1" ? "" : "s"}`;
        }
        if (step.messageTemplate) {
            const key = nodeType === "connect" ? "note" : "message";
            config[key] = step.messageTemplate;
        }
        if (step.conditionType) {
            config.type = step.conditionType;
            config.value = step.conditionValue ?? "";
            label = `ICP Score ≥ ${step.conditionValue ?? "70"}`;
        }

        const node: SequenceNode = { id: nodeId, type: nodeType, label, config, children: [] };
        nodes.push(node);

        // Link previous node to this one
        const prev = nodes.find((n) => n.id === prevId);
        if (prev) prev.children.push(nodeId);
        prevId = nodeId;
    }

    // Add stop node at end
    counter += 1;
    const stopId = `n${counter}`;
    nodes.push({ id: stopId, type: "stop", label: "End", config: {}, children: [] });
    const lastPrev = nodes.find((n) => n.id === prevId);
    if (lastPrev) lastPrev.children.push(stopId);

    return nodes;
}

/** Convert tree-based SequenceNode array to flat API step payload */
function nodesToApiSteps(nodes: SequenceNode[]): { stepOrder: number; actionType: string; messageTemplate: string | null; waitDays: number | null; conditionType: string | null; conditionValue: string | null }[] {
    const steps: { stepOrder: number; actionType: string; messageTemplate: string | null; waitDays: number | null; conditionType: string | null; conditionValue: string | null }[] = [];
    const visited = new Set<string>();

    function walk(nodeId: string, order: number): number {
        if (visited.has(nodeId)) return order;
        visited.add(nodeId);
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return order;

        // Skip start and stop — they are UI-only
        if (node.type !== "start" && node.type !== "stop") {
            let currentOrder = order;
            currentOrder += 1;
            steps.push({
                stepOrder: currentOrder,
                actionType: node.type,
                messageTemplate: node.config.message ?? node.config.note ?? null,
                waitDays: node.type === "wait" ? parseInt(node.config.days ?? "1", 10) : null,
                conditionType: node.config.type ?? null,
                conditionValue: node.config.value ?? null,
            });
            order = currentOrder;
        }

        for (const childId of node.children) {
            order = walk(childId, order);
        }
        return order;
    }

    const root = nodes.find((n) => n.type === "start");
    if (root) walk(root.id, 0);
    return steps;
}

/** Convert template step labels to SequenceNode array */
function templateToNodes(steps: string[]): SequenceNode[] {
    const nodes: SequenceNode[] = [];
    let counter = 0;

    counter += 1;
    const startId = `t${counter}`;
    nodes.push({ id: startId, type: "start", label: "Campaign Started", config: {}, children: [] });

    let prevId = startId;
    for (const step of steps) {
        counter += 1;
        const nodeId = `t${counter}`;

        const waitMatch = WAIT_PATTERN.exec(step);
        if (waitMatch) {
            const days = waitMatch[1];
            nodes.push({ id: nodeId, type: "wait", label: `Wait ${days} day${days === "1" ? "" : "s"}`, config: { days }, children: [] });
        } else {
            const nodeType = STEP_TYPE_MAP[step] ?? "message";
            nodes.push({ id: nodeId, type: nodeType, label: step, config: {}, children: [] });
        }

        const prev = nodes.find((n) => n.id === prevId);
        if (prev) prev.children.push(nodeId);
        prevId = nodeId;
    }

    counter += 1;
    const stopId = `t${counter}`;
    nodes.push({ id: stopId, type: "stop", label: "End", config: {}, children: [] });
    const last = nodes.find((n) => n.id === prevId);
    if (last) last.children.push(stopId);

    return nodes;
}

export default function CampaignCreatePage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const campaignId = params.id;

    const [tab, setTab] = useState<TabKey>("sequences");
    const [showTemplates, setShowTemplates] = useState(false);
    const [campaignName, setCampaignName] = useState("Loading…");
    const [sequenceNodes, setSequenceNodes] = useState<SequenceNode[] | null>(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load(): Promise<void> {
            try {
                const [campRes, seqRes] = await Promise.all([
                    fetch(`/api/campaigns/${campaignId}`),
                    fetch(`/api/campaigns/${campaignId}/sequences`),
                ]);
                if (campRes.ok) {
                    const camp = await campRes.json() as { name: string };
                    setCampaignName(camp.name);
                }
                if (seqRes.ok) {
                    const seqData = await seqRes.json() as ApiSequenceStep[];
                    if (Array.isArray(seqData) && seqData.length > 0) {
                        setSequenceNodes(apiStepsToNodes(seqData));
                    }
                }
            } catch {
                toast.error("Failed to load campaign data");
            } finally {
                setLoading(false);
            }
        }
        void load();
    }, [campaignId]);

    const handleNodesChange = useCallback((nodes: SequenceNode[]) => {
        setSequenceNodes(nodes);
    }, []);

    async function handleSave(): Promise<void> {
        if (!sequenceNodes) return;
        setSaving(true);
        try {
            const steps = nodesToApiSteps(sequenceNodes);
            const res = await fetch(`/api/campaigns/${campaignId}/sequences`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ steps }),
            });
            if (!res.ok) throw new Error("Save failed");
            toast.success("Sequences saved");
        } catch {
            toast.error("Failed to save sequences");
        } finally {
            setSaving(false);
        }
    }

    async function handleDuplicate(): Promise<void> {
        try {
            const res = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: `${campaignName} (Copy)` }),
            });
            if (!res.ok) throw new Error("Duplicate failed");
            const created = await res.json() as { id: string };
            toast.success("Campaign duplicated");
            router.push(`/campaigns/${created.id}/create`);
        } catch {
            toast.error("Failed to duplicate campaign");
        }
    }

    function handleUseTemplate(tmpl: SequenceTemplate): void {
        setSequenceNodes(templateToNodes(tmpl.steps));
        setShowTemplates(false);
        toast.success(`Template "${tmpl.name}" applied`);
    }

    if (loading) {
        return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/campaigns" className="rounded-lg border border-white/10 p-2 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Edit Campaign</h1>
                        <Badge className="border border-amber-500/30 bg-amber-500/15 text-amber-300">EDITING</Badge>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{campaignName}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => setShowTemplates(true)} className="border border-white/10 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white">
                        <FileText className="mr-2 h-4 w-4" /> Templates
                    </Button>
                    <Button variant="ghost" onClick={() => void handleDuplicate()} className="border border-white/10 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white">
                        <Copy className="mr-2 h-4 w-4" /> Duplicate Campaign
                    </Button>
                    <Button onClick={() => void handleSave()} disabled={saving} className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400 disabled:opacity-50">
                        <Settings className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save Changes"}
                    </Button>
                </div>
            </div>

            <div className="flex gap-1 rounded-lg border border-white/10 bg-[var(--bg-input)] p-1">
                {TABS.map((t) => (
                    <button key={t.key} type="button" onClick={() => setTab(t.key)}
                        className={`rounded-md px-4 py-2 text-sm font-medium transition ${tab === t.key ? "bg-purple-500/20 text-purple-300" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "sequences" && (
                <SequenceBuilder
                    initialNodes={sequenceNodes ?? undefined}
                    onNodesChange={handleNodesChange}
                />
            )}

            {tab !== "sequences" && (
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-12 text-center">
                    <p className="text-[var(--text-secondary)]">{tab.charAt(0).toUpperCase() + tab.slice(1)} editor — select Sequences tab for flowchart builder</p>
                </div>
            )}

            {/* Templates Modal */}
            {showTemplates && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[var(--bg-card)] p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Sequence Templates</h2>
                                <p className="text-sm text-[var(--text-secondary)]">Pre-built sequences to get started quickly</p>
                            </div>
                            <button onClick={() => setShowTemplates(false)} className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-white/10 hover:text-white">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                            {SEQUENCE_TEMPLATES.map((tmpl) => (
                                <div key={tmpl.id} className="rounded-xl border border-white/6 bg-white/[0.02] p-4 transition-colors hover:border-purple-500/30 hover:bg-purple-500/5">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-medium text-[var(--text-primary)]">{tmpl.name}</h3>
                                                <Badge variant="outline" className="text-[9px] border-purple-500/30 text-purple-300">{tmpl.category}</Badge>
                                                <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-300">{tmpl.replyRate} reply rate</Badge>
                                            </div>
                                            <p className="mt-1 text-xs text-[var(--text-muted)]">{tmpl.description}</p>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {tmpl.steps.map((step, i) => (
                                                    <span key={i} className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
                                                        {i > 0 && <span className="text-white/20">→</span>}
                                                        <span className="rounded bg-white/5 px-1.5 py-0.5">{step}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleUseTemplate(tmpl)}
                                            className="ml-3 shrink-0 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                                        >
                                            Use Template
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
