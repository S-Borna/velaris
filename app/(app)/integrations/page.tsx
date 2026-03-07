// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
    Puzzle,
    Plus,
    Key,
    Webhook,
    CheckCircle2,
    Copy,
    Eye,
    EyeOff,
    RefreshCw,
    ExternalLink,
    Trash2,
    ArrowRight,
    Clock,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/* ─── Constants ───────────────────────────────────────────── */

const TABS = [
    { key: "apps", label: "Apps", icon: Puzzle },
    { key: "api-keys", label: "API Keys", icon: Key },
    { key: "webhooks", label: "Webhooks", icon: Webhook },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface Integration {
    id: string;
    name: string;
    description: string;
    logo: string;
    category: string;
    connected: boolean;
    status?: "healthy" | "error" | "syncing";
    lastSync?: string;
}

const MOCK_INTEGRATIONS: Integration[] = [
    { id: "hubspot", name: "HubSpot", description: "Sync leads and deals with HubSpot CRM", logo: "🟠", category: "CRM", connected: true, status: "healthy", lastSync: "2 min ago" },
    { id: "salesforce", name: "Salesforce", description: "Push contacts and opportunities to Salesforce", logo: "☁️", category: "CRM", connected: false },
    { id: "pipedrive", name: "Pipedrive", description: "Manage pipeline deals from LinkedIn leads", logo: "🟢", category: "CRM", connected: false },
    { id: "slack", name: "Slack", description: "Get real-time notifications in Slack channels", logo: "💬", category: "Communication", connected: true, status: "healthy", lastSync: "Just now" },
    { id: "zapier", name: "Zapier", description: "Connect 5,000+ apps with automation workflows", logo: "⚡", category: "Automation", connected: false },
    { id: "monday", name: "Monday.com", description: "Sync leads to Monday boards automatically", logo: "🔴", category: "Project Management", connected: false },
    { id: "copper", name: "Copper CRM", description: "Google Workspace native CRM integration", logo: "🟤", category: "CRM", connected: false },
    { id: "browserbase", name: "Browserbase", description: "Cloud browser infrastructure for automation", logo: "🌐", category: "Infrastructure", connected: true, status: "syncing", lastSync: "5 min ago" },
];

interface ApiKeyEntry {
    id: string;
    name: string;
    key: string;
    createdAt: string;
    lastUsed: string;
    status: "active" | "revoked";
}

const MOCK_API_KEYS: ApiKeyEntry[] = [
    { id: "key-1", name: "Production API Key", key: "op_live_sk_a3f8...x9k2", createdAt: "2026-02-15", lastUsed: "2 hours ago", status: "active" },
    { id: "key-2", name: "Development Key", key: "op_test_sk_7b2c...m4n1", createdAt: "2026-03-01", lastUsed: "1 day ago", status: "active" },
    { id: "key-3", name: "Legacy Key (deprecated)", key: "op_live_sk_1d4e...p8q3", createdAt: "2026-01-10", lastUsed: "30 days ago", status: "revoked" },
];

interface WebhookEntry {
    id: string;
    url: string;
    events: string[];
    status: "active" | "failing" | "disabled";
    lastTriggered: string;
    successRate: number;
}

const MOCK_WEBHOOKS: WebhookEntry[] = [
    { id: "wh-1", url: "https://api.example.com/webhooks/leads", events: ["lead.created", "lead.updated"], status: "active", lastTriggered: "10 min ago", successRate: 99.2 },
    { id: "wh-2", url: "https://hooks.slack.com/services/T01/B02/abc", events: ["campaign.completed", "reply.received"], status: "active", lastTriggered: "1 hour ago", successRate: 100 },
    { id: "wh-3", url: "https://old-api.example.com/webhook", events: ["lead.created"], status: "failing", lastTriggered: "3 hours ago", successRate: 45.8 },
];

const STATUS_STYLES: Record<string, string> = {
    healthy: "border-green-500/30 bg-green-500/15 text-green-300",
    error: "border-red-500/30 bg-red-500/15 text-red-300",
    syncing: "border-blue-500/30 bg-blue-500/15 text-blue-300",
    active: "border-green-500/30 bg-green-500/15 text-green-300",
    failing: "border-red-500/30 bg-red-500/15 text-red-300",
    disabled: "border-white/10 bg-white/5 text-[var(--text-muted)]",
    revoked: "border-red-500/30 bg-red-500/15 text-red-300",
};

/* ─── Component ───────────────────────────────────────────── */

/**
 * Integrations page — Apps, API Keys, and Webhooks management.
 */
export default function IntegrationsPage() {
    const [activeTab, setActiveTab] = useState<TabKey>("apps");
    const [showKey, setShowKey] = useState<string | null>(null);
    const [integrations, setIntegrations] = useState(MOCK_INTEGRATIONS);

    function toggleConnection(id: string): void {
        const target = integrations.find((i) => i.id === id);
        const nextConnected = target ? !target.connected : true;
        setIntegrations((prev) =>
            prev.map((int) =>
                int.id === id
                    ? {
                        ...int,
                        connected: nextConnected,
                        status: nextConnected ? "syncing" as const : undefined,
                        lastSync: nextConnected ? "Just now" : undefined,
                    }
                    : int,
            ),
        );
        toast.success(target ? `${target.name} ${nextConnected ? "connected" : "disconnected"}` : "Integration updated");
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">Integrations</h1>
                <p className="text-sm text-[var(--text-secondary)]">
                    Connect your favorite tools, manage API keys, and configure webhooks.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-lg border border-white/6 bg-[var(--bg-card)] p-1">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition ${activeTab === tab.key
                            ? "bg-purple-500/15 text-purple-300"
                            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Apps Tab */}
            {activeTab === "apps" && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {integrations.map((int) => (
                        <div
                            key={int.id}
                            className={`rounded-xl border bg-[var(--bg-card)] p-5 transition ${int.connected ? "border-green-500/20" : "border-white/6"}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-xl">
                                        {int.logo}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{int.name}</h3>
                                            {int.connected && int.status && (
                                                <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[int.status]}`}>
                                                    {int.status}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)]">{int.description}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <div>
                                    <Badge variant="outline" className="border-white/10 text-[10px] text-[var(--text-muted)]">
                                        {int.category}
                                    </Badge>
                                    {int.lastSync && (
                                        <span className="ml-2 text-[10px] text-[var(--text-muted)]">
                                            Last sync: {int.lastSync}
                                        </span>
                                    )}
                                </div>
                                <Button
                                    onClick={() => toggleConnection(int.id)}
                                    variant="outline"
                                    size="sm"
                                    className={int.connected
                                        ? "border-red-500/30 text-red-300 hover:bg-red-500/10"
                                        : "border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                                    }
                                >
                                    {int.connected ? (
                                        <>Disconnect</>
                                    ) : (
                                        <>
                                            Connect
                                            <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* API Keys Tab */}
            {activeTab === "api-keys" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Manage API keys for programmatic access to your Velaris data.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast.info("Create API key dialog coming soon")}
                            className="gap-1.5 border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Create Key
                        </Button>
                    </div>

                    <div className="rounded-xl border border-white/6 bg-[var(--bg-card)]">
                        <div className="divide-y divide-white/4">
                            {MOCK_API_KEYS.map((apiKey) => (
                                <div key={apiKey.id} className="flex items-center justify-between px-5 py-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-[var(--text-primary)]">{apiKey.name}</span>
                                            <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[apiKey.status]}`}>
                                                {apiKey.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <code className="rounded bg-white/5 px-2 py-0.5 font-mono text-xs text-[var(--text-secondary)]">
                                                {showKey === apiKey.id ? apiKey.key.replace("...", "4f8b2a9c1d3e") : apiKey.key}
                                            </code>
                                            <button
                                                onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                                                aria-label={showKey === apiKey.id ? "Hide API key" : "Show API key"}
                                                className="rounded p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
                                            >
                                                {showKey === apiKey.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                            </button>
                                            <button onClick={() => { navigator.clipboard.writeText(apiKey.key); toast.success("API key copied"); }} aria-label="Copy API key" className="rounded p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500">
                                                <Copy className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <div className="flex gap-4 text-[10px] text-[var(--text-muted)]">
                                            <span>Created: {apiKey.createdAt}</span>
                                            <span>Last used: {apiKey.lastUsed}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button onClick={() => toast.info(`"${apiKey.name}" regenerated`)} className="rounded p-1.5 text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]">
                                            <RefreshCw className="h-3.5 w-3.5" />
                                        </button>
                                        <button onClick={() => toast.success(`"${apiKey.name}" revoked`)} className="rounded p-1.5 text-[var(--text-muted)] hover:bg-white/5 hover:text-red-400">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-lg border border-white/6 bg-white/[0.02] p-4">
                        <p className="text-xs text-[var(--text-muted)]">
                            <strong className="text-[var(--text-secondary)]">Documentation:</strong> Full API reference at{" "}
                            <span className="text-purple-400">docs.velaris.dev/api</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Webhooks Tab */}
            {activeTab === "webhooks" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Receive real-time event notifications at your endpoints.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast.info("Add webhook dialog coming soon")}
                            className="gap-1.5 border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Webhook
                        </Button>
                    </div>

                    <div className="rounded-xl border border-white/6 bg-[var(--bg-card)]">
                        <div className="divide-y divide-white/4">
                            {MOCK_WEBHOOKS.map((wh) => (
                                <div key={wh.id} className="px-5 py-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <code className="text-sm font-medium text-[var(--text-primary)]">{wh.url}</code>
                                                <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[wh.status]}`}>
                                                    {wh.status}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {wh.events.map((event) => (
                                                    <Badge key={event} variant="outline" className="border-purple-500/20 bg-purple-500/5 text-purple-300 text-[10px]">
                                                        {event}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <div className="flex gap-4 text-[10px] text-[var(--text-muted)]">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    Last triggered: {wh.lastTriggered}
                                                </span>
                                                <span className={`flex items-center gap-1 ${wh.successRate >= 95 ? "text-green-400" : wh.successRate >= 70 ? "text-amber-400" : "text-red-400"}`}>
                                                    {wh.successRate >= 95 ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertCircle className="h-2.5 w-2.5" />}
                                                    {wh.successRate}% success rate
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button onClick={() => toast.info("Webhook logs coming soon")} className="rounded p-1.5 text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]" title="View logs">
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => toast.success("Retry triggered")} className="rounded p-1.5 text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]" title="Retry failed">
                                                <RefreshCw className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => toast.success("Webhook deleted")} className="rounded p-1.5 text-[var(--text-muted)] hover:bg-white/5 hover:text-red-400" title="Delete">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Webhook test panel */}
                    <div className="rounded-lg border border-white/6 bg-white/[0.02] p-4">
                        <h4 className="mb-2 text-sm font-medium text-[var(--text-primary)]">Test Webhook</h4>
                        <div className="flex gap-2">
                            <Input
                                placeholder="https://your-endpoint.com/webhook"
                                className="border-white/10 bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                            />
                            <Button variant="outline" size="sm" onClick={() => toast.success("Test webhook sent")} className="shrink-0 border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                                Send Test
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
