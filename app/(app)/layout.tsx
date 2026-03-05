// Copyright (c) Said Borna. All rights reserved.
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { SessionProvider } from "@/components/providers/session-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

const SIDEBAR_WIDTH = "220px";

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

        <div className="flex flex-1 flex-col" style={{ marginLeft: SIDEBAR_WIDTH }}>
          <TopBar />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
