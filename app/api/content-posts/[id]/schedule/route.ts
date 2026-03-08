// Copyright (c) Said Borna. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { getWorkspaceIdFromSession } from "@/lib/db/auth-helpers";
import { schedulePost } from "@/lib/db/content-posts";

/* ─── Constants ─────────────────────────────────────── */

const INTERNAL_ERROR_MESSAGE = "Internal server error";

/* ─── Schemas ───────────────────────────────────────── */

const SchedulePostSchema = z.object({
  scheduledAt: z.string().datetime(),
  linkedinAccountId: z.string().uuid(),
});

/* ─── Types ─────────────────────────────────────────── */

interface RouteContext {
  params: Promise<{ id: string }>;
}

/* ─── Route Handler ─────────────────────────────────── */

/**
 * POST /api/content-posts/[id]/schedule — Schedule a post for publishing.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getWorkspaceIdFromSession(session);
    const { id } = await context.params;
    const body: unknown = await request.json();
    const parsed = SchedulePostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const post = await schedulePost(
      workspaceId,
      id,
      new Date(parsed.data.scheduledAt),
      parsed.data.linkedinAccountId
    );

    return NextResponse.json(post);
  } catch (error: unknown) {
    console.error("POST /api/content-posts/[id]/schedule error:", error);
    return NextResponse.json({ error: INTERNAL_ERROR_MESSAGE }, { status: 500 });
  }
}
