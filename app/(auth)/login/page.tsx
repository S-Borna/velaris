// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PAGE_TITLE = "Welcome back";
const PAGE_SUBTITLE = "Sign in to your OutreachPilot account";
const ERROR_INVALID_CREDENTIALS = "Invalid email or password.";

/**
 * Login page — email/password credentials authentication.
 */
export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(ERROR_INVALID_CREDENTIALS);
                return;
            }

            router.push("/dashboard");
            router.refresh();
        } catch {
            setError(ERROR_INVALID_CREDENTIALS);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="rounded-xl border border-white/10 bg-[var(--bg-card)] p-8">
            <div className="mb-6 text-center">
                <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                    {PAGE_TITLE}
                </h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {PAGE_SUBTITLE}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-[var(--text-secondary)]">
                        Email
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="border-white/10 bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-[var(--purple-500)]"
                        aria-label="Email address"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password" className="text-[var(--text-secondary)]">
                        Password
                    </Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="border-white/10 bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-[var(--purple-500)]"
                        aria-label="Password"
                    />
                </div>

                {error && (
                    <p className="text-sm text-[var(--red-500)]" role="alert">
                        {error}
                    </p>
                )}

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[var(--purple-500)] to-[#A855F7] font-medium text-white hover:from-[var(--purple-600)] hover:to-[var(--purple-500)]"
                >
                    {isLoading ? "Signing in..." : "Sign In"}
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
                Don&apos;t have an account?{" "}
                <Link
                    href="/signup"
                    className="font-medium text-[var(--purple-500)] hover:text-[var(--purple-600)]"
                >
                    Sign up
                </Link>
            </p>
        </div>
    );
}
