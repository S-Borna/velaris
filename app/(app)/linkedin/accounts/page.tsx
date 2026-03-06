// Copyright (c) Said Borna. All rights reserved.
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Linkedin, MoreHorizontal, Plus } from "lucide-react";

const LINKEDIN_ACCOUNTS = [
    {
        account: "Mathias Warg",
        status: "connected",
        type: "Sales Navigator",
        connections: "8,240",
        usage: "31 / 50",
        lastSync: "2 min ago",
    },
    {
        account: "[redacted]",
        status: "connected",
        type: "Premium",
        connections: "5,912",
        usage: "22 / 50",
        lastSync: "5 min ago",
    },
    {
        account: "[redacted]",
        status: "syncing",
        type: "Premium",
        connections: "4,508",
        usage: "18 / 50",
        lastSync: "Syncing now",
    },
    {
        account: "Martin Smith",
        status: "error",
        type: "Basic",
        connections: "3,192",
        usage: "0 / 50",
        lastSync: "1h ago",
    },
];

function StatusBadge({ status }: { status: string }) {
    if (status === "connected") {
        return <Badge className="border border-green-500/30 bg-green-500/15 text-green-300">Connected</Badge>;
    }

    if (status === "syncing") {
        return <Badge className="border border-amber-500/30 bg-amber-500/15 text-amber-300">Syncing</Badge>;
    }

    return <Badge className="border border-red-500/30 bg-red-500/15 text-red-300">Error</Badge>;
}

export default function LinkedInAccountsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">LinkedIn Accounts</h1>
                    <p className="text-sm text-[var(--text-secondary)]">Manage sender accounts, usage, sync status and health</p>
                </div>

                <Button className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-500 hover:to-purple-400">
                    <Plus className="mr-2 h-4 w-4" />
                    Add LinkedIn Account
                </Button>
            </div>

            <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-5">
                <div className="mb-4 flex items-center gap-2 text-[var(--text-secondary)]">
                    <Linkedin className="h-4 w-4" />
                    <span className="text-sm">4 accounts connected</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-left text-[var(--text-secondary)]">
                                <th className="px-3 py-3 font-medium">Account</th>
                                <th className="px-3 py-3 font-medium">Status</th>
                                <th className="px-3 py-3 font-medium">Type</th>
                                <th className="px-3 py-3 font-medium">Connections</th>
                                <th className="px-3 py-3 font-medium">Daily Messages Usage</th>
                                <th className="px-3 py-3 font-medium">Last Sync</th>
                                <th className="px-3 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {LINKEDIN_ACCOUNTS.map((row) => (
                                <tr key={row.account} className="border-b border-white/6 text-[var(--text-primary)]">
                                    <td className="px-3 py-3">{row.account}</td>
                                    <td className="px-3 py-3">
                                        <StatusBadge status={row.status} />
                                    </td>
                                    <td className="px-3 py-3 text-[var(--text-secondary)]">{row.type}</td>
                                    <td className="px-3 py-3">{row.connections}</td>
                                    <td className="px-3 py-3">{row.usage}</td>
                                    <td className="px-3 py-3 text-[var(--text-secondary)]">{row.lastSync}</td>
                                    <td className="px-3 py-3">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--text-secondary)] hover:bg-white/10 hover:text-white">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
