// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { ArrowLeft, ArrowRight, Check, FileText, Linkedin, Users, Calendar, Workflow } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
    { key: "setup", label: "Setup", icon: FileText },
    { key: "leads", label: "Leads", icon: Users },
    { key: "accounts", label: "LinkedIn Accounts", icon: Linkedin },
    { key: "sequences", label: "Sequences", icon: Workflow },
    { key: "schedule", label: "Schedule", icon: Calendar },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

const LEAD_SOURCES = [
    { id: "csv", label: "Upload CSV", desc: "Import leads from a CSV file" },
    { id: "database", label: "Lead Database", desc: "Search your lead database" },
    { id: "extractor", label: "Lead Extractor", desc: "Extract from LinkedIn search" },
];

interface LinkedInAccount {
    id: string;
    name: string;
    type: string;
}

const MOCK_ACCOUNTS: LinkedInAccount[] = [
    { id: "a1", name: "Said Borna", type: "Sales Navigator" },
    { id: "a2", name: "Nolan Vance", type: "Premium" },
    { id: "a3", name: "Ezra Kaplan", type: "Premium" },
];

const TYPE_LABELS: Record<string, string> = {
    sales_navigator: "Sales Navigator",
    premium: "Premium",
    basic: "Basic",
};

export default function NewCampaignPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [campaignName, setCampaignName] = useState("");
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [timezone, setTimezone] = useState("Europe/Stockholm");
    const [startHour, setStartHour] = useState("09:00");
    const [endHour, setEndHour] = useState("17:00");
    const [accounts, setAccounts] = useState<LinkedInAccount[]>(MOCK_ACCOUNTS);
    const [creating, setCreating] = useState(false);

    const step = STEPS[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === STEPS.length - 1;

    function canProceed(): boolean {
        if (step.key === "setup") return campaignName.trim().length > 0;
        if (step.key === "leads") return selectedSource !== null;
        if (step.key === "accounts") return selectedAccounts.length > 0;
        return true;
    }

    useEffect(() => {
        async function loadAccounts(): Promise<void> {
            try {
                const res = await fetch("/api/linkedin-accounts");
                if (!res.ok) throw new Error("fetch failed");
                const data = await res.json() as Record<string, unknown>[];
                const mapped: LinkedInAccount[] = data.map((a) => ({
                    id: String(a.id),
                    name: String(a.accountName),
                    type: TYPE_LABELS[String(a.accountType)] ?? String(a.accountType),
                }));
                if (mapped.length > 0) setAccounts(mapped);
            } catch {
                /* keep MOCK_ACCOUNTS */
            }
        }
        void loadAccounts();
    }, []);

    function toggleAccount(id: string): void {
        setSelectedAccounts((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
    }

    async function handleFinish(): Promise<void> {
        setCreating(true);
        try {
            const startH = parseInt(startHour.split(":")[0], 10);
            const endH = parseInt(endHour.split(":")[0], 10);
            const res = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: campaignName,
                    scheduleTimezone: timezone,
                    scheduleStartHour: startH,
                    scheduleEndHour: endH,
                }),
            });
            if (!res.ok) throw new Error("Create failed");
            const campaign = await res.json() as { id: string };
            toast.success("Campaign created!");
            router.push(`/campaigns/${campaign.id}/create`);
        } catch {
            toast.error("Failed to create campaign");
            setCreating(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <button type="button" onClick={() => router.push("/campaigns")} className="rounded-lg border border-white/10 p-2 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition">
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create Campaign</h1>
            </div>

            <div className="flex items-center gap-2">
                {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const isActive = i === currentStep;
                    const isDone = i < currentStep;
                    return (
                        <div key={s.key} className="flex items-center gap-2">
                            <button type="button" onClick={() => { if (i < currentStep) setCurrentStep(i); }}
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${isActive ? "border-purple-500/50 bg-purple-500/15 text-purple-300" :
                                        isDone ? "border-green-500/30 bg-green-500/10 text-green-300" :
                                            "border-white/10 bg-[var(--bg-input)] text-[var(--text-muted)]"}`}>
                                {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                                {s.label}
                            </button>
                            {i < STEPS.length - 1 && <div className={`h-px w-6 ${i < currentStep ? "bg-green-500/40" : "bg-white/10"}`} />}
                        </div>
                    );
                })}
            </div>

            <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-6">
                {step.key === "setup" && (
                    <div className="max-w-md space-y-4">
                        <label className="block">
                            <span className="text-sm font-medium text-[var(--text-primary)]">Campaign Name</span>
                            <input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)}
                                placeholder="e.g. Outreach to Agency Owners"
                                className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                        </label>
                    </div>
                )}

                {step.key === "leads" && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-[var(--text-primary)]">Select Lead Source</h3>
                        {LEAD_SOURCES.map((src) => (
                            <button key={src.id} type="button" onClick={() => setSelectedSource(src.id)}
                                className={`flex w-full items-start gap-4 rounded-lg border p-4 text-left transition ${selectedSource === src.id ? "border-purple-500/50 bg-purple-500/10" : "border-white/10 bg-[var(--bg-input)] hover:bg-white/5"}`}>
                                <div>
                                    <p className="text-sm font-medium text-[var(--text-primary)]">{src.label}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">{src.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {step.key === "accounts" && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-[var(--text-primary)]">Select LinkedIn Accounts</h3>
                        {accounts.map((acc) => (
                            <button key={acc.id} type="button" onClick={() => toggleAccount(acc.id)}
                                className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition ${selectedAccounts.includes(acc.id) ? "border-purple-500/50 bg-purple-500/10" : "border-white/10 bg-[var(--bg-input)] hover:bg-white/5"}`}>
                                <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-medium text-purple-300">{acc.name.charAt(0)}</div>
                                <div>
                                    <p className="text-sm font-medium text-[var(--text-primary)]">{acc.name}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">{acc.type}</p>
                                </div>
                                {selectedAccounts.includes(acc.id) && <Check className="ml-auto h-4 w-4 text-green-400" />}
                            </button>
                        ))}
                    </div>
                )}

                {step.key === "sequences" && (
                    <div className="text-center py-8">
                        <p className="text-[var(--text-secondary)] mb-4">The visual sequence builder will appear here</p>
                        <p className="text-xs text-[var(--text-muted)]">Add connection requests, messages, wait steps, and conditions to build your outreach flow</p>
                    </div>
                )}

                {step.key === "schedule" && (
                    <div className="max-w-md space-y-4">
                        <label className="block">
                            <span className="text-sm font-medium text-[var(--text-primary)]">Timezone</span>
                            <div className="mt-2">
                                <CustomSelect
                                    value={timezone}
                                    onChange={setTimezone}
                                    options={[
                                        { label: "Europe/Stockholm (CET)", value: "Europe/Stockholm" },
                                        { label: "America/New_York (EST)", value: "America/New_York" },
                                        { label: "America/Los_Angeles (PST)", value: "America/Los_Angeles" },
                                        { label: "UTC", value: "UTC" },
                                    ]}
                                    triggerClassName="h-12"
                                />
                            </div>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                                <span className="text-sm font-medium text-[var(--text-primary)]">Start Hour</span>
                                <input type="time" value={startHour} onChange={(e) => setStartHour(e.target.value)}
                                    className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-4 text-sm text-[var(--text-primary)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-[var(--text-primary)]">End Hour</span>
                                <input type="time" value={endHour} onChange={(e) => setEndHour(e.target.value)}
                                    className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-[var(--bg-input)] px-4 text-sm text-[var(--text-primary)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                            </label>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                <Button variant="ghost" disabled={isFirst} onClick={() => setCurrentStep((s) => s - 1)}
                    className="border border-white/10 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white disabled:opacity-40">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                {isLast ? (
                    <Button onClick={() => void handleFinish()} disabled={creating} className="bg-purple-600 text-white hover:bg-purple-500">
                        <Check className="mr-2 h-4 w-4" /> {creating ? "Creating…" : "Create Campaign"}
                    </Button>
                ) : (
                    <Button disabled={!canProceed()} onClick={() => setCurrentStep((s) => s + 1)}
                        className="bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40">
                        Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
