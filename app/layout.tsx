// Copyright (c) Said Borna. All rights reserved.
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/providers/toaster";

const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ["latin"],
    variable: "--font-plus-jakarta",
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: "Velaris — LinkedIn Automation & AI Content",
    description:
        "Find, message, and close ideal leads on LinkedIn with AI-powered outreach automation.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className={`${plusJakartaSans.variable} font-sans antialiased`}>
                {children}
                <Toaster />
            </body>
        </html>
    );
}
