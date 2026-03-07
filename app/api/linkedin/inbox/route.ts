// Copyright (c) Said Borna. All rights reserved.
// Velaris — LinkedIn Inbox Messages API

import { NextResponse } from "next/server";
import { z } from "zod";
import { createLinkedInAdapter } from "@/lib/linkedin";

const MAX_INBOX_MESSAGES = 50;

const InboxSchema = z.object({
  account: z.object({
    accountName: z.string().min(1, "Account name is required"),
    sessionCookie: z.string().optional(),
    proxyUrl: z.string().optional(),
  }),
  limit: z.number().int().min(1).max(MAX_INBOX_MESSAGES).default(20),
});

/**
 * POST /api/linkedin/inbox
 * Get recent inbox messages from LinkedIn.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = InboxSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { account, limit } = parsed.data;
    const adapter = createLinkedInAdapter();

    const connectResult = await adapter.connect({
      accountName: account.accountName,
      sessionCookie: account.sessionCookie ?? "",
      proxyUrl: account.proxyUrl,
    });

    if (!connectResult.success) {
      return NextResponse.json(
        { error: connectResult.message },
        { status: 401 }
      );
    }

    const messages = await adapter.getInboxMessages(limit);
    await adapter.disconnect();

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
