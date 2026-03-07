// Copyright (c) Said Borna. All rights reserved.
// Velaris — LinkedIn Lead Extraction API

import { NextResponse } from "next/server";
import { z } from "zod";
import { createLinkedInAdapter } from "@/lib/linkedin";

const MAX_LEADS_PER_EXTRACTION = 100;

const ExtractLeadsSchema = z.object({
  account: z.object({
    accountName: z.string().min(1, "Account name is required"),
    sessionCookie: z.string().optional(),
    proxyUrl: z.string().optional(),
  }),
  searchUrl: z.string().url("Valid LinkedIn search URL required"),
  maxLeads: z
    .number()
    .int()
    .min(1)
    .max(MAX_LEADS_PER_EXTRACTION)
    .default(25),
});

/**
 * POST /api/linkedin/extract
 * Extract leads from a LinkedIn search results page.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = ExtractLeadsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { account, searchUrl, maxLeads } = parsed.data;
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

    const leads = await adapter.extractLeads(searchUrl, maxLeads);
    await adapter.disconnect();

    return NextResponse.json({
      success: true,
      count: leads.length,
      leads,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
