// Copyright (c) Said Borna. All rights reserved.
// Velaris — Content Generation API Route

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  generateContent,
  ContentInputSchema,
} from "@/lib/ai/content-generator";
import { ZodError, ZodIssue } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import { aiLimiter, getRateLimitKey } from "@/lib/security/rate-limiter";

/* ─── Constants ─────────────────────────────────────── */

const RATE_LIMIT_MESSAGE = "Too many requests. Please wait before generating again.";
const INTERNAL_ERROR_MESSAGE = "Failed to generate content. Please try again.";

/* ─── Route Handler ─────────────────────────────────── */

/**
 * POST /api/content/generate
 * Accepts content parameters, generates 3 LinkedIn post variants via Claude API.
 * Requires authentication.
 *
 * Body: { category, topic, audience, language, tone, brandVoiceSamples? }
 * Returns: { variants: GeneratedVariant[], model, tokensUsed }
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

    // Resolve workspace for usage tracking / audit
    const workspaceId = await getWorkspaceIdFromSession(session);

    const body: unknown = await request.json();
    const input = ContentInputSchema.parse(body);
    const result = await generateContent(input);

    console.info(`[Content Generate] workspace=${workspaceId} tokens=${result.tokensUsed}`);

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

    // Anthropic rate limit errors
    if (
      error instanceof Error &&
      error.message.includes("rate_limit")
    ) {
      return NextResponse.json(
        { error: RATE_LIMIT_MESSAGE },
        { status: 429 }
      );
    }

    // Log the actual error server-side for debugging
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Content Generate API]", errorMessage);

    return NextResponse.json(
      { error: INTERNAL_ERROR_MESSAGE },
      { status: 500 }
    );
  }
}
