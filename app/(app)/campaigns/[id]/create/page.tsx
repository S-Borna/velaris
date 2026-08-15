// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SequenceBuilder } from "@/components/campaigns/sequence-builder";
import { ArrowLeft, Copy, Save } from "lucide-react";

// ─── Types ──────────────────────────────────────────────

type Tab = "sequences" | "schedule" | "accounts" | "leads" | "analytics";

const TABS: Array<{ key: Tab; label: string }> = [
    { key: "analytics", label: "Analytics" },
    { key: "leads", label: "Leads" },
    { key: "sequences", label: "Sequences" },
    { key: "schedule", label: "Schedule" },
    { key: "accounts", label: "LinkedIn Accounts" },
];

interface Campaign {
    id: string;
    name: string;
    status: string;
    scheduleTimezone: string;
    scheduleStartHour: number;
    scheduleEndHour: number;
    scheduleDays: string[];
    totalLeads: number;
}

// ─── Main Component ─────────────────────────────────────

export default function CampaignEditorPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const [tab, setTab] = useState<Tab>("sequences");
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Editable schedule fields
    const [timezone, setTimezone] = useState("Europe/Stockholm");
    const [startHour, setStartHour] = useState(9);
    const [endHour, setEndHour] = useState(17);

    const fetchCampaign = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/campaigns/${id}`);
            if (!res.ok) throw new Error("Not found");
            const json = await res.json();
            const c = json.data;
            setCampaign(c);
            setTimezone(c.scheduleTimezone ?? "Europe/Stockholm");
            setStartHour(c.scheduleStartHour ?? 9);
            setEndHour(c.scheduleEndHour ?? 17);
        } catch {
            setCampaign(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchCampaign();
    }, [fetchCampaign]);

    async function handleSaveSchedule(): Promise<void> {
        setSaving(true);
        try {
            await fetch(`/api/campaigns/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    scheduleTimezone: timezone,
                    scheduleStartHour: startHour,
                    scheduleEndHour: endHour,
                }),
            });
            fetchCampaign();
        } catch {
            // Silent fail
        } finally {
            setSaving(false);
        }
    }

    async function handleDuplicate(): Promise<void> {
        try {
            await fetch(`/api/campaigns/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "duplicate" }),
            });
        } catch {
            // Silent fail
        }
    }

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-8 w-64 rounded bg-white/10" />
                <div className="h-10 w-full rounded bg-white/10" />
                <div className="h-96 rounded-xl bg-white/5" />
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="flex h-64 items-center justify-center text-[var(--text-muted)]">
                Campaign not found
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/campaigns"
                        className="rounded-lg border border-white/10 p-2 transition-colors hover:bg-white/5"
                    >
                        <ArrowLeft className="h-4 w-4 text-[var(--text-secondary)]" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-[var(--text-primary)]">
                                Edit Campaign
                            </h1>
                            <Badge className="border-yellow-500/30 bg-yellow-500/10 text-yellow-300">
                                EDITING
                            </Badge>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">
                            {campaign.name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDuplicate}
                        className="border-white/10"
                    >
                        <Copy className="mr-1 h-3.5 w-3.5" /> Duplicate Campaign
                    </Button>
                    {tab === "schedule" && (
                        <Button
                            size="sm"
                            onClick={handleSaveSchedule}
                            disabled={saving}
                            className="bg-purple-600 text-white hover:bg-purple-500"
                        >
                            <Save className="mr-1 h-3.5 w-3.5" />
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-lg border border-white/10 bg-[var(--bg-input)] p-1">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        className={`rounded-md px-4 py-2 text-xs font-medium transition ${
                            tab === t.key
                                ? "bg-purple-500 text-white"
                                : "text-[var(--text-secondary)] hover:bg-white/5"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tab === "sequences" && (
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                    <SequenceBuilder />
                </div>
            )}

            {tab === "schedule" && (
                <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-6">
                    <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
                        Campaign Schedule
                    </h3>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <label
                                htmlFor="edit-timezone"
                                className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                            >
                                Timezone
                            </label>
                            <input
                                id="edit-timezone"
                                type="text"
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] focus:border-purple-500/50 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="edit-start"
                                className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                            >
                                Start Hour
                            </label>
                            <input
                                id="edit-start"
                                type="number"
                                min={0}
                                max={23}
                                value={startHour}
                                onChange={(e) =>
                                    setStartHour(parseInt(e.target.value, 10))
                                }
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] focus:border-purple-500/50 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="edit-end"
                                className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                            >
                                End Hour
                            </label>
                            <input
                                id="edit-end"
                                type="number"
                                min={0}
                                max={23}
                                value={endHour}
                                onChange={(e) =>
                                    setEndHour(parseInt(e.target.value, 10))
                                }
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] focus:border-purple-500/50 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            )}

            {tab === "analytics" && (
                <div className="flex h-48 items-center justify-center rounded-xl border border-white/10 bg-[var(--bg-card)] text-sm text-[var(--text-muted)]">
                    View analytics on the campaign detail page
                </div>
            )}

            {tab === "leads" && (
                <div className="flex h-48 items-center justify-center rounded-xl border border-white/10 bg-[var(--bg-card)] text-sm text-[var(--text-muted)]">
                    Manage leads on the campaign detail page
                </div>
            )}

            {tab === "accounts" && (
                <div className="flex h-48 items-center justify-center rounded-xl border border-white/10 bg-[var(--bg-card)] text-sm text-[var(--text-muted)]">
                    Manage linked accounts on the campaign detail page
                </div>
            )}
        </div>
    );
}
