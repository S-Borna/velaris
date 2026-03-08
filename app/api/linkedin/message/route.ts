// Copyright (c) Said Borna. All rights reserved.
// Velaris — LinkedIn Send Message API

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import { createLinkedInAdapter } from "@/lib/linkedin";
import { prisma } from "@/lib/db/prisma";
import { aiLimiter, getRateLimitKey } from "@/lib/security/rate-limiter";

const INTERNAL_ERROR_MESSAGE = "Failed to send message. Please try again.";

const SendMessageSchema = z.object({
  linkedinAccountId: z.string().uuid("Valid LinkedIn account ID required"),
  lead: z.object({
    linkedinUrl: z.string().min(1, "LinkedIn URL is required"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    headline: z.string().optional(),
    company: z.string().optional(),
  }),
  message: z.string().min(1, "Message is required").max(8000),
});

/**
 * POST /api/linkedin/message
 * Send a direct message to a connected lead.
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
    const parsed = SendMessageSchema.safeParse(body);
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

    const result = await adapter.sendMessage(
      {
        linkedinUrl: parsed.data.lead.linkedinUrl,
        firstName: parsed.data.lead.firstName,
        lastName: parsed.data.lead.lastName,
        headline: parsed.data.lead.headline,
        company: parsed.data.lead.company,
      },
      parsed.data.message
    );

    await adapter.disconnect();
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[LinkedIn Message API]", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
