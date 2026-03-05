// Copyright (c) Said Borna. All rights reserved.
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/**
 * Client-side session provider wrapper for NextAuth.
 */
export function SessionProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
