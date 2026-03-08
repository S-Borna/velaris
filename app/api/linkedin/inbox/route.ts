// Copyright (c) Said Borna. All rights reserved.
// Velaris — LinkedIn Inbox Messages API

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import { createLinkedInAdapter } from "@/lib/linkedin";
import { prisma } from "@/lib/db/prisma";
import { aiLimiter, getRateLimitKey } from "@/lib/security/rate-limiter";

const MAX_INBOX_MESSAGES = 50;
const INTERNAL_ERROR_MESSAGE = "Failed to fetch inbox. Please try again.";

const InboxSchema = z.object({
  linkedinAccountId: z.string().uuid("Valid LinkedIn account ID required"),
  limit: z.number().int().min(1).max(MAX_INBOX_MESSAGES).default(20),
});

/**
 * POST /api/linkedin/inbox
 * Get recent inbox messages from LinkedIn.
 * Requires authentication. Reads session cookie from database.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitResult = aiLimiter.check(getRateLimitKey(request));
    if (!limitResult.allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
    }

    const body: unknown = await request.json();
    const parsed = InboxSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const account = await prisma.linkedinAccount.findFirst({
      where: { id: parsed.data.linkedinAccountId, workspaceId },
      select: { accountName: true, sessionCookie: true, proxyUrl: true },
    });

    if (!account) {
      return NextResponse.json({ error: "LinkedIn account not found" }, { status: 404 });
    }

    const adapter = createLinkedInAdapter();
    const connectResult = await adapter.connect({
      accountName: account.accountName,
      sessionCookie: account.sessionCookie ?? "",
      proxyUrl: account.proxyUrl ?? undefined,
    });

    if (!connectResult.success) {
      return NextResponse.json({ error: "Failed to connect LinkedIn account" }, { status: 502 });
    }

    const messages = await adapter.getInboxMessages(parsed.data.limit);
    await adapter.disconnect();

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error: unknown) {
    console.error("[LinkedIn Inbox API]", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
