// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    Check,
    FileText,
    Linkedin,
    Users,
    Workflow,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────

interface StepDef {
    label: string;
    icon: React.ReactNode;
}

interface LinkedInAccount {
    id: string;
    accountName: string;
    accountType: string;
    status: string;
}

// ─── Constants ──────────────────────────────────────────

const STEPS: StepDef[] = [
    { label: "Setup", icon: <FileText className="h-4 w-4" /> },
    { label: "Leads", icon: <Users className="h-4 w-4" /> },
    { label: "LinkedIn Accounts", icon: <Linkedin className="h-4 w-4" /> },
    { label: "Sequences", icon: <Workflow className="h-4 w-4" /> },
    { label: "Schedule", icon: <Calendar className="h-4 w-4" /> },
];

const LEAD_SOURCES = [
    { id: "csv", title: "Upload CSV", description: "Import leads from a CSV file" },
    { id: "database", title: "Lead Database", description: "Select from your existing leads" },
    { id: "extractor", title: "Lead Extractor", description: "Extract from LinkedIn search" },
];

const TIMEZONE_OPTIONS = [
    { label: "Europe/Stockholm", value: "Europe/Stockholm" },
    { label: "America/New_York", value: "America/New_York" },
    { label: "America/Los_Angeles", value: "America/Los_Angeles" },
    { label: "UTC", value: "UTC" },
];

// ─── Main Component ─────────────────────────────────────

export default function NewCampaignPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);

    // Step 1: Setup
    const [name, setName] = useState("");

    // Step 2: Leads (source selection only — actual assignment happens later)
    const [leadSource, setLeadSource] = useState<string | null>(null);

    // Step 3: LinkedIn Accounts
    const [accounts, setAccounts] = useState<LinkedInAccount[]>([]);
    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

    // Step 5: Schedule
    const [timezone, setTimezone] = useState("Europe/Stockholm");
    const [startHour, setStartHour] = useState("09:00");
    const [endHour, setEndHour] = useState("17:00");

    // Fetch LinkedIn accounts
    const fetchAccounts = useCallback(async () => {
        try {
            const res = await fetch("/api/linkedin-accounts");
            if (!res.ok) return;
            const json = await res.json();
            setAccounts(json.data?.data ?? []);
        } catch {
            setAccounts([]);
        }
    }, []);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    function toggleAccount(id: string): void {
        setSelectedAccountIds((prev) =>
            prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
        );
    }

    function canProceed(): boolean {
        if (step === 0) return name.trim().length > 0;
        if (step === 1) return leadSource !== null;
        if (step === 2) return selectedAccountIds.length > 0;
        return true;
    }

    async function handleFinish(): Promise<void> {
        setSaving(true);
        try {
            const parsedStart = parseInt(startHour.split(":")[0], 10);
            const parsedEnd = parseInt(endHour.split(":")[0], 10);

            const res = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    scheduleTimezone: timezone,
                    scheduleStartHour: parsedStart,
                    scheduleEndHour: parsedEnd,
                    scheduleDays: ["mon", "tue", "wed", "thu", "fri"],
                }),
            });

            if (!res.ok) throw new Error("Failed to create campaign");

            const json = await res.json();
            const campaignId = json.data?.id;

            // Link selected LinkedIn accounts via sequences PUT
            if (campaignId && selectedAccountIds.length > 0) {
                await fetch(`/api/campaigns/${campaignId}/sequences`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        steps: [],
                        linkedinAccountIds: selectedAccountIds,
                    }),
                });
            }

            router.push(campaignId ? `/campaigns/${campaignId}` : "/campaigns");
        } catch {
            setSaving(false);
        }
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => router.push("/campaigns")}
                    className="rounded-lg border border-white/10 p-2 transition-colors hover:bg-white/5"
                >
                    <ArrowLeft className="h-4 w-4 text-[var(--text-secondary)]" />
                </button>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">
                    Create Campaign
                </h1>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-between">
                {STEPS.map((s, i) => (
                    <div key={s.label} className="flex items-center">
                        <button
                            type="button"
                            onClick={() => i <= step && setStep(i)}
                            disabled={i > step}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                                i === step
                                    ? "bg-purple-500/10 text-purple-300 border border-purple-500/30"
                                    : i < step
                                      ? "bg-green-500/10 text-green-300 border border-green-500/30"
                                      : "text-[var(--text-muted)] border border-transparent"
                            }`}
                        >
                            {i < step ? (
                                <Check className="h-3.5 w-3.5" />
                            ) : (
                                s.icon
                            )}
                            <span className="hidden sm:inline">{s.label}</span>
                        </button>
                        {i < STEPS.length - 1 && (
                            <div
                                className={`mx-2 h-px w-6 ${
                                    i < step ? "bg-green-500/40" : "bg-white/10"
                                }`}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-6">
                {/* Step 0: Setup */}
                {step === 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                            Campaign Setup
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Give your campaign a name to get started.
                        </p>
                        <div>
                            <label
                                htmlFor="campaign-name"
                                className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                            >
                                Campaign Name
                            </label>
                            <input
                                id="campaign-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Outreach to Agency Owners"
                                className="w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-purple-500/50 focus:outline-none"
                            />
                        </div>
                    </div>
                )}

                {/* Step 1: Lead Source */}
                {step === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                            Lead Source
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Choose how you want to add leads to this campaign.
                        </p>
                        <div className="grid gap-3 md:grid-cols-3">
                            {LEAD_SOURCES.map((source) => (
                                <button
                                    key={source.id}
                                    type="button"
                                    onClick={() => setLeadSource(source.id)}
                                    className={`rounded-lg border p-4 text-left transition ${
                                        leadSource === source.id
                                            ? "border-purple-500/50 bg-purple-500/5"
                                            : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                                    }`}
                                >
                                    <p className="text-sm font-medium text-[var(--text-primary)]">
                                        {source.title}
                                    </p>
                                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                                        {source.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: LinkedIn Accounts */}
                {step === 2 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                            LinkedIn Accounts
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Select which LinkedIn accounts will send outreach for this campaign.
                        </p>
                        {accounts.length === 0 ? (
                            <div className="flex h-32 items-center justify-center text-sm text-[var(--text-muted)]">
                                No LinkedIn accounts connected yet
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {accounts.map((acc) => {
                                    const selected = selectedAccountIds.includes(acc.id);
                                    return (
                                        <button
                                            key={acc.id}
                                            type="button"
                                            onClick={() => toggleAccount(acc.id)}
                                            className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                                                selected
                                                    ? "border-purple-500/50 bg-purple-500/5"
                                                    : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                                            }`}
                                        >
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/20 text-sm font-bold text-purple-300">
                                                {acc.accountName.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-[var(--text-primary)]">
                                                    {acc.accountName}
                                                </p>
                                                <p className="text-xs text-[var(--text-secondary)]">
                                                    {acc.accountType}
                                                </p>
                                            </div>
                                            {selected && (
                                                <Check className="h-4 w-4 text-purple-400" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Sequences */}
                {step === 3 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                            Sequences
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Sequences will be configured after creating the campaign using the
                            visual sequence builder.
                        </p>
                        <div className="flex h-32 items-center justify-center rounded-lg border border-white/6 bg-white/[0.02]">
                            <p className="text-sm text-[var(--text-muted)]">
                                Available after campaign creation
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 4: Schedule */}
                {step === 4 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                            Schedule
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Set when the campaign should run.
                        </p>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <label
                                    htmlFor="timezone-select"
                                    className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                                >
                                    Timezone
                                </label>
                                <CustomSelect
                                    aria-label="Timezone"
                                    value={timezone}
                                    onChange={(val) => setTimezone(val)}
                                    options={TIMEZONE_OPTIONS}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="start-hour"
                                    className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                                >
                                    Start Hour
                                </label>
                                <input
                                    id="start-hour"
                                    type="time"
                                    value={startHour}
                                    onChange={(e) => setStartHour(e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] focus:border-purple-500/50 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="end-hour"
                                    className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                                >
                                    End Hour
                                </label>
                                <input
                                    id="end-hour"
                                    type="time"
                                    value={endHour}
                                    onChange={(e) => setEndHour(e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] focus:border-purple-500/50 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={() => setStep((s) => s - 1)}
                    disabled={step === 0}
                    className="border-white/10"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>

                {step < STEPS.length - 1 ? (
                    <Button
                        onClick={() => setStep((s) => s + 1)}
                        disabled={!canProceed()}
                        className="bg-purple-600 text-white hover:bg-purple-500"
                    >
                        Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleFinish}
                        disabled={saving || !name.trim()}
                        className="bg-purple-600 text-white hover:bg-purple-500"
                    >
                        {saving ? "Creating..." : "Create Campaign"}
                    </Button>
                )}
            </div>
        </div>
    );
}
