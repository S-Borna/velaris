// Copyright (c) Said Borna. All rights reserved.
// Velaris — LinkedIn Connection Request API

import { NextResponse } from "next/server";
import { z } from "zod";
import { createLinkedInAdapter } from "@/lib/linkedin";

const ConnectionRequestSchema = z.object({
  account: z.object({
    accountName: z.string().min(1, "Account name is required"),
    sessionCookie: z.string().optional(),
    proxyUrl: z.string().optional(),
  }),
  lead: z.object({
    linkedinUrl: z.string().min(1, "LinkedIn URL is required"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    headline: z.string().optional(),
    company: z.string().optional(),
  }),
  note: z.string().max(300, "Connection note max 300 characters").optional(),
});

/**
 * POST /api/linkedin/connect
 * Send a connection request to a LinkedIn lead.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = ConnectionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { account, lead, note } = parsed.data;
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

    const result = await adapter.sendConnectionRequest(
      {
        linkedinUrl: lead.linkedinUrl,
        firstName: lead.firstName,
        lastName: lead.lastName,
        headline: lead.headline,
        company: lead.company,
      },
      note
    );

    await adapter.disconnect();

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
