// Copyright (c) Said Borna. All rights reserved.
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { SessionProvider } from "@/components/providers/session-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { DemoDisclaimer } from "@/components/marketing/demo-disclaimer";

/**
 * Authenticated app layout — sidebar + top bar + main content.
 * Redirects unauthenticated users to /login.
 */
export default async function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/login");
    }

    const userName = session.user.name || session.user.email || "User";

    return (
        <SessionProvider>
            <div className="flex min-h-screen bg-[var(--bg-primary)]">
                <Sidebar userName={userName} />

                {/* Desktop: offset by sidebar width. Mobile: full width with top padding for hamburger */}
                <div
                    className="flex flex-1 flex-col md:ml-[220px]"
                >
                    <TopBar />
                    <main className="flex-1 animate-fade-in p-4 pt-14 md:p-6 md:pt-6">{children}</main>
                </div>
                <DemoDisclaimer />
            </div>
        </SessionProvider>
    );
}
