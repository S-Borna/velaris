// Copyright (c) Said Borna. All rights reserved.
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/options";

/**
 * NextAuth API route handler — handles all /api/auth/* requests.
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
