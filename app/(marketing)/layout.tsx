// Copyright (c) Said Borna. All rights reserved.
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { DemoDisclaimer } from "@/components/marketing/demo-disclaimer";

/**
 * Marketing layout — public pages with navbar + footer, no sidebar.
 * Used for landing page, pricing, blog, etc.
 */
export default function MarketingLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <DemoDisclaimer />
        </div>
    );
}
