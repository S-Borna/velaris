// Copyright (c) Said Borna. All rights reserved.
// Velaris — Lead Enrichment API Route

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ZodError, ZodIssue } from "zod";
import {
  enrichByLinkedin,
  enrichByEmail,
  enrichByName,
  EnrichByLinkedinSchema,
  EnrichByEmailSchema,
  EnrichByNameSchema,
} from "@/lib/enrichment/pdl-client";
import { authOptions } from "@/lib/auth/options";
import { aiLimiter, getRateLimitKey } from "@/lib/security/rate-limiter";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Failed to enrich lead. Please try again.";

/* ─── Route Handler ─────────────────────────────────── */

/**
 * POST /api/leads/enrich
 * Enriches a lead via People Data Labs.
 * Requires authentication.
 *
 * Body must include one of:
 * - { linkedinUrl: string }
 * - { email: string }
 * - { firstName: string, lastName: string, company?: string }
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

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Request body must be a JSON object" },
        { status: 400 }
      );
    }

    const bodyObj = body as Record<string, unknown>;

    // Determine enrichment method based on provided fields
    if (bodyObj.linkedinUrl) {
      const input = EnrichByLinkedinSchema.parse(body);
      const result = await enrichByLinkedin(input);
      return NextResponse.json(result, { status: 200 });
    }

    if (bodyObj.email) {
      const input = EnrichByEmailSchema.parse(body);
      const result = await enrichByEmail(input);
      return NextResponse.json(result, { status: 200 });
    }

    if (bodyObj.firstName && bodyObj.lastName) {
      const input = EnrichByNameSchema.parse(body);
      const result = await enrichByName(input);
      return NextResponse.json(result, { status: 200 });
    }

    return NextResponse.json(
      {
        error:
          "Provide one of: linkedinUrl, email, or firstName+lastName for enrichment",
      },
      { status: 400 }
    );
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

    // PDL not found errors
    if (
      error instanceof Error &&
      error.message.includes("404")
    ) {
      return NextResponse.json(
        { error: "No matching person found" },
        { status: 404 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Lead Enrich API]", errorMessage);

    return NextResponse.json(
      { error: INTERNAL_ERROR_MESSAGE },
      { status: 500 }
    );
  }
}
