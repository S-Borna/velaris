// Copyright (c) Said Borna. All rights reserved.
// Velaris — Lead Search API Route (People Data Labs)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError, ZodIssue } from "zod";
import { searchLeads, LeadSearchSchema } from "@/lib/enrichment/pdl-client";
import { authOptions } from "@/lib/auth/options";
import { aiLimiter, getRateLimitKey } from "@/lib/security/rate-limiter";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Failed to search leads. Please try again.";

/* ─── Route Handler ─────────────────────────────────── */

/**
 * POST /api/leads/search
 * Search for leads via People Data Labs person search API.
 * Requires authentication.
 *
 * Body: { query, size?, jobTitle?, companyName?, location?, industry? }
 * Returns: { leads: EnrichedLead[], total: number }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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
    const input = LeadSearchSchema.parse(body);
    const result = await searchLeads(input);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const fieldErrors = error.issues.map((issue: ZodIssue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json(
        { error: "Validation failed", details: fieldErrors },
        { status: 400 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Lead Search API]", errorMessage);

    return NextResponse.json(
      { error: INTERNAL_ERROR_MESSAGE },
      { status: 500 }
    );
  }
}
