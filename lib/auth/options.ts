// Copyright (c) Said Borna. All rights reserved.
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/db/prisma";

const SALT_ROUNDS = 12;

/**
 * NextAuth configuration — credentials provider with Prisma adapter.
 * Supports email/password login. OAuth providers can be added later.
 */
export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60, // 7 days (not default 30)
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.passwordHash) {
                    return null;
                }

                const isValidPassword = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash,
                );

                if (!isValidPassword) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.fullName,
                    image: user.avatarUrl,
                };
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        },
    },
};

/**
 * Hash a plain-text password for storage.
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}
