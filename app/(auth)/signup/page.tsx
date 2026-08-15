// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PAGE_TITLE = "Create your account";
const PAGE_SUBTITLE = "Start automating your LinkedIn outreach today";
const ERROR_GENERIC = "Something went wrong. Please try again.";
const ERROR_EMAIL_EXISTS = "An account with this email already exists.";

/**
 * Signup page — creates a new user with email/password.
 */
export default function SignupPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, email, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                if (response.status === 409) {
                    setError(ERROR_EMAIL_EXISTS);
                } else {
                    setError(data.error || ERROR_GENERIC);
                }
                return;
            }

            router.push("/login?registered=true");
        } catch {
            setError(ERROR_GENERIC);
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
                    <Label htmlFor="fullName" className="text-[var(--text-secondary)]">
                        Full Name
                    </Label>
                    <Input
                        id="fullName"
                        type="text"
                        placeholder="Jane Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        disabled={isLoading}
                        className="border-white/10 bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:ring-[var(--purple-500)]"
                        aria-label="Full name"
                    />
                </div>

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
                        minLength={8}
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
                    className="w-full bg-[var(--purple-500)] font-medium text-white hover:bg-[var(--purple-600)]"
                >
                    {isLoading ? "Creating account..." : "Create Account"}
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="font-medium text-[var(--purple-500)] hover:text-[var(--purple-600)]"
                >
                    Sign in
                </Link>
            </p>
        </div>
    );
}
