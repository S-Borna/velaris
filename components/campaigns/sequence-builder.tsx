// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    ArrowDown,
    Clock,
    GitBranch,
    Link2,
    MessageSquare,
    Mic,
    Eye,
    ThumbsUp,
    Plus,
    Trash2,
    X,
    CircleDot,
    Square,
} from "lucide-react";

type NodeType = "start" | "condition" | "connect" | "message" | "voice_note" | "view_profile" | "like_post" | "wait" | "stop";

interface SequenceNode {
    id: string;
    type: NodeType;
    label: string;
    config: Record<string, string>;
    children: string[];
}

const NODE_PALETTE: { type: NodeType; label: string; icon: typeof MessageSquare; color: string }[] = [
    { type: "connect", label: "Send Connection", icon: Link2, color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
    { type: "message", label: "Send Message", icon: MessageSquare, color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
    { type: "voice_note", label: "Voice Note", icon: Mic, color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
    { type: "view_profile", label: "View Profile", icon: Eye, color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
    { type: "like_post", label: "Like Post", icon: ThumbsUp, color: "bg-green-500/20 text-green-300 border-green-500/30" },
    { type: "wait", label: "Wait", icon: Clock, color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    { type: "condition", label: "Condition", icon: GitBranch, color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
];

const INITIAL_NODES: SequenceNode[] = [
    { id: "n1", type: "start", label: "Campaign Started", config: {}, children: ["n2"] },
    { id: "n2", type: "condition", label: "ICP Score ≥ 70", config: { type: "icp_above", value: "70" }, children: ["n3", "n7"] },
    { id: "n3", type: "connect", label: "Send Connection", config: { note: "Hi {{firstName}}, I'd love to connect!" }, children: ["n4"] },
    { id: "n4", type: "wait", label: "Wait 3 days", config: { days: "3" }, children: ["n5"] },
    { id: "n5", type: "message", label: "Send Follow-up", config: { message: "Thanks for connecting! I noticed you're working on..." }, children: ["n6"] },
    { id: "n6", type: "wait", label: "Wait 1 day", config: { days: "1" }, children: [] },
    { id: "n7", type: "stop", label: "End (Low ICP)", config: {}, children: [] },
];

let nodeCounter = 100;

function getNodeStyle(type: NodeType): string {
    const styles: Record<NodeType, string> = {
        start: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        condition: "bg-orange-500/20 text-orange-300 border-orange-500/30",
        connect: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        message: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        voice_note: "bg-pink-500/20 text-pink-300 border-pink-500/30",
        view_profile: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        like_post: "bg-green-500/20 text-green-300 border-green-500/30",
        wait: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        stop: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    return styles[type];
}

function getNodeIcon(type: NodeType) {
    const icons: Record<NodeType, typeof MessageSquare> = {
        start: CircleDot,
        condition: GitBranch,
        connect: Link2,
        message: MessageSquare,
        voice_note: Mic,
        view_profile: Eye,
        like_post: ThumbsUp,
        wait: Clock,
        stop: Square,
    };
    return icons[type];
}

export function SequenceBuilder() {
    const [nodes, setNodes] = useState<SequenceNode[]>(INITIAL_NODES);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showPalette, setShowPalette] = useState<string | null>(null);

    const selectedNode = nodes.find((n) => n.id === selectedId);

    function addNodeAfter(parentId: string, type: NodeType): void {
        nodeCounter += 1;
        const newId = `n${nodeCounter}`;
        const label = NODE_PALETTE.find((p) => p.type === type)?.label ?? type;

        const newNode: SequenceNode = {
            id: newId,
            type,
            label,
            config: type === "wait" ? { days: "1" } : {},
            children: [],
        };

        setNodes((prev) => {
            const updated = prev.map((n) => {
                if (n.id === parentId) {
                    return { ...n, children: [...n.children, newId] };
                }
                return n;
            });
            return [...updated, newNode];
        });
        setShowPalette(null);
    }

    function removeNode(nodeId: string): void {
        setNodes((prev) => {
            const filtered = prev.filter((n) => n.id !== nodeId);
            return filtered.map((n) => ({
                ...n,
                children: n.children.filter((c) => c !== nodeId),
            }));
        });
        if (selectedId === nodeId) {
            setSelectedId(null);
        }
    }

    function updateNodeLabel(nodeId: string, label: string): void {
        setNodes((prev) => prev.map((n) => n.id === nodeId ? { ...n, label } : n));
    }

    function renderNode(nodeId: string, depth: number): React.ReactNode {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return null;

        const Icon = getNodeIcon(node.type);
        const style = getNodeStyle(node.type);
        const isSelected = selectedId === nodeId;
        const isTerminal = node.type === "start" || node.type === "stop";

        return (
            <div key={node.id} className="flex flex-col items-center">
                <button
                    type="button"
                    onClick={() => setSelectedId(node.id)}
                    className={`relative flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition ${style} ${isSelected ? "ring-2 ring-purple-500 ring-offset-1 ring-offset-[var(--bg-primary)]" : "hover:brightness-110"} ${node.type === "condition" ? "rotate-0" : ""}`}
                >
                    <Icon className="h-4 w-4" />
                    {node.label}
                    {!isTerminal && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}
                            className="ml-2 rounded p-0.5 hover:bg-white/10"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </button>

                {node.children.length > 0 && (
                    <>
                        <div className="h-6 w-px bg-white/20" />
                        <ArrowDown className="h-3 w-3 text-white/30" />
                        {node.children.length === 1 ? (
                            renderNode(node.children[0], depth + 1)
                        ) : (
                            <div className="flex gap-8">
                                {node.children.map((childId, i) => (
                                    <div key={childId} className="flex flex-col items-center">
                                        <span className="mb-2 text-[10px] text-[var(--text-muted)]">
                                            {i === 0 ? "Pass" : "Fail"}
                                        </span>
                                        {renderNode(childId, depth + 1)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {node.type !== "stop" && node.children.length === 0 && (
                    <>
                        <div className="h-4 w-px bg-white/20" />
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowPalette(showPalette === node.id ? null : node.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-white/20 text-[var(--text-muted)] hover:border-purple-500/50 hover:text-purple-300 transition"
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </button>
                            {showPalette === node.id && (
                                <div className="absolute left-1/2 top-9 z-10 -translate-x-1/2 rounded-lg border border-white/10 bg-[var(--bg-card)] p-2 shadow-xl min-w-[180px]">
                                    {NODE_PALETTE.map((item) => {
                                        const PIcon = item.icon;
                                        return (
                                            <button
                                                key={item.type}
                                                type="button"
                                                onClick={() => addNodeAfter(node.id, item.type)}
                                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)] transition"
                                            >
                                                <PIcon className="h-3.5 w-3.5" />
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }

    const rootNode = nodes.find((n) => n.type === "start");

    return (
        <div className="flex gap-6">
            <div className="flex-1 overflow-auto rounded-xl border border-white/10 bg-[var(--bg-card)] p-8">
                <div className="flex flex-col items-center min-h-[400px]">
                    {rootNode ? renderNode(rootNode.id, 0) : (
                        <p className="text-[var(--text-muted)]">No sequence nodes</p>
                    )}
                </div>
            </div>

            <div className="w-72 shrink-0 rounded-xl border border-white/10 bg-[var(--bg-card)] p-4">
                <h3 className="mb-4 text-sm font-medium text-[var(--text-primary)]">Node Properties</h3>
                {selectedNode ? (
                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-xs text-[var(--text-secondary)]">Label</span>
                            <input
                                type="text"
                                value={selectedNode.label}
                                onChange={(e) => updateNodeLabel(selectedNode.id, e.target.value)}
                                className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)] focus:border-purple-500 focus:outline-none"
                            />
                        </label>
                        <div>
                            <span className="text-xs text-[var(--text-secondary)]">Type</span>
                            <p className="mt-1 text-sm text-[var(--text-primary)] capitalize">{selectedNode.type.replace("_", " ")}</p>
                        </div>
                        {selectedNode.type === "wait" && (
                            <label className="block">
                                <span className="text-xs text-[var(--text-secondary)]">Wait days</span>
                                <input
                                    type="number"
                                    min={1}
                                    value={selectedNode.config.days ?? "1"}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setNodes((prev) => prev.map((n) => n.id === selectedNode.id ? { ...n, config: { ...n.config, days: val } } : n));
                                    }}
                                    className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)] focus:border-purple-500 focus:outline-none"
                                />
                            </label>
                        )}
                        {(selectedNode.type === "message" || selectedNode.type === "connect") && (
                            <label className="block">
                                <span className="text-xs text-[var(--text-secondary)]">Message Template</span>
                                <textarea
                                    rows={4}
                                    value={selectedNode.config.message ?? selectedNode.config.note ?? ""}
                                    onChange={(e) => {
                                        const key = selectedNode.type === "connect" ? "note" : "message";
                                        setNodes((prev) => prev.map((n) => n.id === selectedNode.id ? { ...n, config: { ...n.config, [key]: e.target.value } } : n));
                                    }}
                                    className="mt-1 w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-purple-500 focus:outline-none resize-none"
                                />
                            </label>
                        )}
                        {selectedNode.type !== "start" && selectedNode.type !== "stop" && (
                            <Button variant="ghost" onClick={() => removeNode(selectedNode.id)} className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Remove Node
                            </Button>
                        )}
                    </div>
                ) : (
                    <p className="text-xs text-[var(--text-muted)]">Click a node to edit its properties</p>
                )}
            </div>
        </div>
    );
}
