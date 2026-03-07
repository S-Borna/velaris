// Copyright (c) Said Borna. All rights reserved.
// Velaris — ICP Scoring API Route

import { NextRequest, NextResponse } from "next/server";
import { scoreLeadsForIcp, IcpScoringInputSchema } from "@/lib/ai/icp-scorer";
import { ZodError, ZodIssue } from "zod";

/* ─── Constants ─────────────────────────────────────── */

const RATE_LIMIT_MESSAGE = "Too many requests. Please wait before scoring again.";
const INTERNAL_ERROR_MESSAGE = "Failed to score leads. Please try again.";

/* ─── Route Handler ─────────────────────────────────── */

/**
 * POST /api/leads/score
 * Accepts ICP description + lead profiles, returns AI-generated scores.
 *
 * Body: { icpDescription, minScore?, leads: LeadProfile[] }
 * Returns: { scores: LeadScore[], model, tokensUsed }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const input = IcpScoringInputSchema.parse(body);
    const result = await scoreLeadsForIcp(input);

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

    if (
      error instanceof Error &&
      error.message.includes("rate_limit")
    ) {
      return NextResponse.json(
        { error: RATE_LIMIT_MESSAGE },
        { status: 429 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[ICP Score API]", errorMessage);

    return NextResponse.json(
      { error: INTERNAL_ERROR_MESSAGE },
      { status: 500 }
    );
  }
}
