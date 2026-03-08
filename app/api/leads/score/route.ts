// Copyright (c) Said Borna. All rights reserved.
// Velaris — ICP Scoring API Route

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { scoreLeadsForIcp, IcpScoringInputSchema } from "@/lib/ai/icp-scorer";
import { ZodError, ZodIssue } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import { aiLimiter, getRateLimitKey } from "@/lib/security/rate-limiter";

/* ─── Constants ─────────────────────────────────────── */

const RATE_LIMIT_MESSAGE = "Too many requests. Please wait before scoring again.";
const INTERNAL_ERROR_MESSAGE = "Failed to score leads. Please try again.";

/* ─── Route Handler ─────────────────────────────────── */

/**
 * POST /api/leads/score
 * Accepts ICP description + lead profiles, returns AI-generated scores.
 * Requires authentication.
 *
 * Body: { icpDescription, minScore?, leads: LeadProfile[] }
 * Returns: { scores: LeadScore[], model, tokensUsed }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitResult = aiLimiter.check(getRateLimitKey(request));
    if (!limitResult.allowed) {
      return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
    }

    const body: unknown = await request.json();
    const input = IcpScoringInputSchema.parse(body);

    // Resolve workspace for usage tracking / audit
    const workspaceId = await getWorkspaceIdFromSession(session);
    const result = await scoreLeadsForIcp(input);
    console.info(`[ICP Score] workspace=${workspaceId} leads=${input.leads.length} tokens=${result.tokensUsed}`);

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
