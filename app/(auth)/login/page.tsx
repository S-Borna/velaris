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
const PAGE_SUBTITLE = "Sign in to your Velaris account";
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
        <div className="relative rounded-2xl bg-gradient-to-b from-purple-400/20 via-white/[0.08] to-white/[0.03] p-[1px] shadow-2xl shadow-purple-950/40">
            <div className="relative rounded-2xl bg-[#1A1025]/85 p-10 backdrop-blur-xl">
                <div
                    className="pointer-events-none absolute -bottom-8 left-1/2 h-16 w-64 -translate-x-1/2 rounded-full bg-purple-500/25 blur-3xl"
                    aria-hidden="true"
                />

                <div className="relative mb-8 text-center">
                    <h1 className="text-2xl font-bold text-white">
                        {PAGE_TITLE}
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                        {PAGE_SUBTITLE}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="relative space-y-5">
                    <div className="space-y-2.5">
                        <Label htmlFor="email" className="text-sm font-medium text-slate-300">
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
                            className="h-12 rounded-lg border border-white/[0.08] bg-[#151020] text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                            aria-label="Email address"
                        />
                    </div>

                    <div className="space-y-2.5">
                        <Label htmlFor="password" className="text-sm font-medium text-slate-300">
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
                            className="h-12 rounded-lg border border-white/[0.08] bg-[#151020] text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                            aria-label="Password"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-400" role="alert">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-12 w-full rounded-lg bg-purple-600 font-semibold text-white transition-all duration-200 hover:-translate-y-[1px] hover:bg-purple-500 hover:shadow-xl hover:shadow-purple-900/40"
                    >
                        {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                </form>

                <p className="relative mt-7 text-center text-sm text-slate-400">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/signup"
                        className="font-medium text-purple-400 transition-colors hover:text-purple-300"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
